import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useRecordingStore } from '../../store/recordingStore'
import { audioRecordingService } from '../../services/audioRecordingService'
import { ociRealtimeService } from '../../services/ociRealtimeService'
import ProcessingOverlay, { NOTE_PROCESSING_STEPS } from '../components/ProcessingOverlay'
import { ROUTES } from '../routes'
import AnimatedRecordButton from '../components/AnimatedRecordButton'
import BottomNav from '../components/BottomNav'
import ListeningModeView from '../components/ListeningModeView'
import ProfileMenu from '../components/ProfileMenu'
import TemplateSelectionSheet from '../components/TemplateSelectionSheet'
import { useEditorStore } from '../../store/editorStore'
import Logo from '../components/Logo'

import { apiClient } from '../../services/apiClient'

// ...
export default function HomeScreen() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { isRecording, error } = useRecordingStore()
  const [showListeningMode, setShowListeningMode] = useState(false)
  const [showTemplateSheet, setShowTemplateSheet] = useState(false)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    checkPermissionStatus()
    // Warm the OCI Realtime token while the doctor is still looking at the
    // home screen, so pressing the mic starts instantly (token already cached
    // in memory + chrome.storage.local).
    ociRealtimeService.prefetchToken().catch(() => {})
  }, [])

  const checkPermissionStatus = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      setPermissionStatus(result.state as 'prompt' | 'granted' | 'denied')
      result.onchange = () => {
        setPermissionStatus(result.state as 'prompt' | 'granted' | 'denied')
      }
    } catch {
      setPermissionStatus('prompt')
    }
  }

  const handleRecordClick = async () => {
    if (!isRecording) {
      if (permissionStatus === 'denied') {
        setShowPermissionModal(true)
        return
      }
      try {
        await audioRecordingService.startRecording()
        setShowListeningMode(true)
        setPermissionStatus('granted')
      } catch (error: any) {
        if (error.name === 'NotAllowedError') {
          setShowPermissionModal(true)
          await checkPermissionStatus()
        } else {
          console.error('Failed to start recording:', error)
        }
      }
    }
  }

  const handleRequestPermission = async () => {
    try {
      const granted = await audioRecordingService.getMicrophonePermission()
      if (granted) {
        setPermissionStatus('granted')
        setShowPermissionModal(false)
        await audioRecordingService.startRecording()
        setShowListeningMode(true)
      } else {
        setPermissionStatus('denied')
      }
    } catch {
      setPermissionStatus('denied')
    }
  }

  const handleStopRecording = async () => {
    try {
      await audioRecordingService.stopRecording()
    } catch (error: any) {
      if (error?.message !== 'No active recording') {
        console.error('Failed to stop recording:', error)
      }
    } finally {
      setShowListeningMode(false)
      setShowTemplateSheet(true)
    }
  }

  const handleTemplateSelect = async (template: any) => {
    setShowTemplateSheet(false)
    setIsSaving(true)
    
    const store = useRecordingStore.getState()
    const transcriptText = store.finalTranscript || store.realtimeTranscript
    
    try {
      const response = await apiClient.saveNote({
        raw_text: transcriptText || '',
        patient_name: 'Untitled',
        summary: null
      })
      
      const newNoteId = (response as any).data?.id || (response as any).payload?.id
      
      if (newNoteId) {
        audioRecordingService.clearRecording()
        navigate(ROUTES.NOTE_DETAIL.replace(':noteId', newNoteId), { state: { autoApplyMacroId: template.id } })
      } else {
        navigate(ROUTES.EDITOR)
      }
    } catch (error) {
      console.error('Failed to save note:', error)
      navigate(ROUTES.EDITOR)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelRecording = () => {
    audioRecordingService.clearRecording()
    setShowListeningMode(false)
  }



  const handleInboxClick = () => {
    navigate(ROUTES.INBOX)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Logo className="h-12 w-auto" variant="dark" />
          </div>
          <ProfileMenu />
        </div>

        <div className="mb-6 bg-gradient-to-r from-blue-600 to-teal-500 rounded-xl p-4 text-white shadow-md">
          <h2 className="text-lg font-bold">Welcome back, {user?.name || 'Doctor'}</h2>
          <p className="text-xs text-blue-100 mt-0.5">Ready for voice documentation?</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-600">Completed</div>
                <div className="text-xl font-bold">24</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-600">Pending</div>
                <div className="text-xl font-bold">3</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleInboxClick}
              className="bg-white rounded-xl shadow-md p-4 text-left hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Inbox</div>
                  <div className="text-sm text-gray-600">3 new notes</div>
                </div>
              </div>
            </button>

            <button className="bg-white rounded-xl shadow-md p-4 text-left hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Templates</div>
                  <div className="text-sm text-gray-600">12 available</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="text-sm text-gray-600 mb-4">Start a new recording session</div>
          <div className="flex justify-center">
            <AnimatedRecordButton
              isRecording={isRecording}
              onClick={handleRecordClick}
              size="large"
            />
          </div>
          <p className="mt-4 text-sm text-gray-600">
            {isRecording 
              ? 'Recording in progress...' 
              : 'Tap to start voice documentation'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Recent Notes</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <div className="font-medium text-gray-900">Patient Consultation</div>
                <div className="text-sm text-gray-600">10 minutes ago</div>
              </div>
              <div className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Completed
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <div className="font-medium text-gray-900">Follow-up Visit</div>
                <div className="text-sm text-gray-600">2 hours ago</div>
              </div>
              <div className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Processing
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav activeRoute="home" />

      {showListeningMode && isRecording && (
        <ListeningModeView
          onStopRecording={handleStopRecording}
          onCancel={handleCancelRecording}
        />
      )}

      {showPermissionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Microphone Access Required</h3>
              {permissionStatus === 'denied' ? (
                <div className="text-sm text-gray-600 space-y-2">
                  <p>Microphone access is blocked. To enable it:</p>
                  <ol className="text-left list-decimal list-inside space-y-1 bg-gray-50 p-3 rounded-lg">
                    <li>Click the lock/icon in the address bar</li>
                    <li>Find "Microphone" permission</li>
                    <li>Change it to "Allow"</li>
                    <li>Reload the extension</li>
                  </ol>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  SoutNote needs access to your microphone to record voice notes. Please allow microphone access when prompted.
                </p>
              )}
            </div>
            {permissionStatus === 'denied' ? (
              <button
                onClick={() => setShowPermissionModal(false)}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Got it
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleRequestPermission}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl font-medium hover:from-blue-700 hover:to-teal-600 transition-colors"
                >
                  Allow Microphone
                </button>
                <button
                  onClick={() => setShowPermissionModal(false)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <TemplateSelectionSheet 
        isOpen={showTemplateSheet}
        onClose={() => setShowTemplateSheet(false)}
        onSelectTemplate={handleTemplateSelect}
      />

      {isSaving && (
        <ProcessingOverlay
          step="Saving recording..."
          progress={10}
          stepsList={NOTE_PROCESSING_STEPS}
          onCancel={() => {}}
        />
      )}
    </div>
  )
}