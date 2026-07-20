import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecordingStore } from '../../store/recordingStore'
import { useEditorStore } from '../../store/editorStore'
import { transcriptionService } from '../../services/transcriptionService'
import { apiClient } from '../../services/apiClient'
import { ROUTES } from '../routes'
import PatternHighlightEditor from '../components/PatternHighlightEditor'
import TemplateCard from '../components/TemplateCard'
import ProcessingOverlay from '../components/ProcessingOverlay'
import BottomNav from '../components/BottomNav'
import Logo from '../components/Logo'

export default function EditorScreen() {
  const navigate = useNavigate()
  const { audioBlob, realtimeTranscript, finalTranscript } = useRecordingStore()
  const {
    currentNote,
    selectedTemplate,
    processedContent,
    setProcessedContent,
    setLoading,
    clearEditor
  } = useEditorStore()

  const [templates, setTemplates] = useState<any[]>([])
  const [showTemplates, setShowTemplates] = useState(!useEditorStore.getState().selectedTemplate)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingError, setProcessingError] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()

    if (audioBlob && !currentNote) {
      startProcessing()
    }

    return () => {
      transcriptionService.cancel()
      clearEditor()
    }
  }, [])

  const loadTemplates = async () => {
    try {
      const mockTemplates = [
        {
          id: '1',
          name: 'General Consultation',
          description: 'Standard patient consultation template',
          fields: ['patient_name', 'age', 'symptoms', 'diagnosis', 'treatment'],
          department: 'General',
          isDefault: true
        },
        {
          id: '2',
          name: 'Follow-up Visit',
          description: 'Follow-up patient visit template',
          fields: ['patient_name', 'visit_date', 'progress', 'next_steps'],
          department: 'General',
          isDefault: false
        },
        {
          id: '3',
          name: 'Prescription',
          description: 'Medical prescription template',
          fields: ['patient_name', 'medication', 'dosage', 'frequency', 'duration'],
          department: 'Pharmacy',
          isDefault: false
        },
        {
          id: '4',
          name: 'Lab Results',
          description: 'Laboratory results documentation',
          fields: ['patient_name', 'test_name', 'results', 'interpretation'],
          department: 'Laboratory',
          isDefault: false
        }
      ]
      setTemplates(mockTemplates)
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const startProcessing = async () => {
    const transcriptText = finalTranscript || realtimeTranscript

    if (!audioBlob && !transcriptText) {
      navigate(ROUTES.HOME)
      return
    }

    setIsProcessing(true)
    setLoading(true)
    setProcessingError(null)
    setProcessingProgress(10)

    try {
      let transcript = transcriptText

      if (!transcript && audioBlob) {
        setProcessingStep('Uploading audio...')
        setProcessingProgress(20)

        transcript = await transcriptionService.transcribeOracle(
          audioBlob,
          'en',
          'WHISPER_LARGE_V3T',
          (status) => {
            if (status === 'processing') {
              setProcessingStep('Transcribing audio...')
              setProcessingProgress(55)
            } else {
              setProcessingStep('Waiting in queue...')
              setProcessingProgress(35)
            }
          }
        )
      }

      setProcessingStep('Formatting notes with AI...')
      setProcessingProgress(75)

      // Simulate AI template application delay
      await new Promise(r => setTimeout(r, 2000))

      setProcessingStep('Saving note...')
      setProcessingProgress(90)

      await apiClient.saveNote({
        raw_text: transcript || '',
        patient_name: 'Untitled',
        summary: null
      }).catch((error: any) => {
        console.error('Failed to save note:', error)
      })

      setProcessingProgress(100)
      setProcessingStep('Finalizing...')

      await new Promise(r => setTimeout(r, 600))

      // Simulate the formatted text since we don't have the backend AI connected here
      const templateName = useEditorStore.getState().selectedTemplate?.name || 'Processed Note'
      const formattedText = `[FORMATTED AS: ${templateName}]\n\n${transcript || ''}`

      setProcessedContent(formattedText)
      setShowTemplates(false)
    } catch (error: any) {
      console.error('Processing failed:', error)
      setProcessingError(error.message || 'Processing failed. Please try again.')
    } finally {
      setIsProcessing(false)
      setLoading(false)
      setProcessingProgress(0)
    }
  }

  const handleTemplateSelect = (template: any) => {
    useEditorStore.getState().setSelectedTemplate(template)
    setShowTemplates(false)
  }

  const handleSmartCopy = () => {
    const text = processedContent
    navigator.clipboard.writeText(text)

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'SMART_COPY',
          content: text
        })
      }
    })
  }

  const handleInjectToPage = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'INJECT_CONTENT',
          content: processedContent,
          template: selectedTemplate
        })
      }
    })
  }

  const handleSaveNote = async () => {
    if (!processedContent) return

    try {
      await apiClient.saveNote({
        raw_text: processedContent,
        patient_name: 'Untitled',
        summary: null
      })
      navigate(ROUTES.HOME)
    } catch (error) {
      console.error('Failed to save note:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Logo className="h-12 w-auto" variant="dark" />
          </div>

          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="flex items-center text-gray-600 hover:text-gray-900 font-semibold px-3 py-1.5 bg-white/80 border border-gray-200 rounded-lg shadow-sm text-sm transition-all"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">
            {selectedTemplate ? selectedTemplate.name : 'New Note'}
          </h1>
        </div>

        {processingError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 text-sm">{processingError}</p>
            </div>
            <button
              onClick={startProcessing}
              className="mt-2 text-sm text-red-600 underline hover:text-red-800"
            >
              Retry
            </button>
          </div>
        )}

        {showTemplates && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Template</h2>
            <div className="grid grid-cols-2 gap-4">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplate?.id === template.id}
                  onSelect={() => handleTemplateSelect(template)}
                />
              ))}
            </div>
          </div>
        )}

        {!showTemplates && processedContent && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Processed Content</h3>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-green-600">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Ready
                    </div>
                  </div>
                </div>
              </div>

              <PatternHighlightEditor
                content={processedContent}
                onChange={setProcessedContent}
                readOnly={false}
              />
            </div>

            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSmartCopy}
                  className="flex items-center justify-center space-x-2 bg-blue-50 text-blue-700 font-semibold py-3 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Smart Copy</span>
                </button>

                <button
                  onClick={handleInjectToPage}
                  className="flex items-center justify-center space-x-2 bg-teal-50 text-teal-700 font-semibold py-3 rounded-lg hover:bg-teal-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  <span>Inject to Page</span>
                </button>

                <button
                  onClick={handleSaveNote}
                  className="flex items-center justify-center space-x-2 bg-green-50 text-green-700 font-semibold py-3 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save Note</span>
                </button>

                <button
                  onClick={() => setShowTemplates(true)}
                  className="flex items-center justify-center space-x-2 bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>Change Template</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {isProcessing && (
          <ProcessingOverlay
            step={processingStep}
            progress={processingProgress}
            stepsList={[
              'Uploading audio...',
              'Transcribing audio...',
              'Formatting notes with AI...',
              'Saving note...',
              'Finalizing...'
            ]}
            onCancel={() => {
              transcriptionService.cancel()
              setIsProcessing(false)
              setLoading(false)
              setProcessingProgress(0)
            }}
          />
        )}
      </div>

      <BottomNav activeRoute="record" />
    </div>
  )
}