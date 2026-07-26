import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../routes'
import ProfileMenu from './ProfileMenu'
import { useRecordingStore } from '../../store/recordingStore'
import { useSettingsStore } from '../../store/settingsStore'
import { audioRecordingService } from '../../services/audioRecordingService'
import { apiClient } from '../../services/apiClient'
import TemplateSelectionSheet from './TemplateSelectionSheet'
import ProcessingOverlay, { NOTE_PROCESSING_STEPS } from './ProcessingOverlay'
import ListeningModeView from './ListeningModeView'
import { enqueue as enqueueOfflineAudio } from '../../pwa/offline/audioQueue'

interface BottomNavProps {
  activeRoute: 'home' | 'inbox' | 'record' | 'profile'
}

export default function BottomNav({ activeRoute }: BottomNavProps) {
  const navigate = useNavigate()
  const { isRecording, duration } = useRecordingStore()
  
  const [showTemplateSheet, setShowTemplateSheet] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt')

  const isInboxActive = activeRoute === 'home' || activeRoute === 'inbox'

  useEffect(() => {
    navigator.permissions.query({ name: 'microphone' as PermissionName }).then(result => {
      setPermissionStatus(result.state as 'prompt' | 'granted' | 'denied')
      result.onchange = () => {
        setPermissionStatus(result.state as 'prompt' | 'granted' | 'denied')
      }
    }).catch(() => {})
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleRecordClick = async () => {
    if (isRecording) {
      try {
        await audioRecordingService.stopRecording()
      } catch (error: any) {
        if (error?.message !== 'No active recording') console.error('Failed to stop recording:', error)
      } finally {
        setShowTemplateSheet(true)
      }
    } else {
      if (permissionStatus === 'denied') {
        alert('Microphone access is denied. Please allow it in the browser settings.')
        return
      }
      try {
        await audioRecordingService.startRecording()
        setPermissionStatus('granted')
      } catch (error: any) {
        if (error.name === 'NotAllowedError') {
          alert('Microphone access is required to record.')
        } else {
          console.error('Failed to start recording:', error)
        }
      }
    }
  }

  const handleCancelRecording = () => {
    audioRecordingService.clearRecording()
  }

  const handleTemplateSelect = async (template: any) => {
    setShowTemplateSheet(false)
    setIsSaving(true)
    setSaveError(null)

    const store = useRecordingStore.getState()
    const transcriptText = store.finalTranscript || store.realtimeTranscript
    const specialty = useSettingsStore.getState().doctorSpecialty
    const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine

    // ── Offline path: no transcript available (OCI realtime was skipped),
    // so we queue the raw audio for async transcription on reconnect.
    if (!isOnline && store.audioBlob) {
      try {
        await enqueueOfflineAudio({
          blob: store.audioBlob,
          templateId: template?.id ?? null,
          specialty,
        })
        audioRecordingService.clearRecording()
        setSaveError('تم حفظ التسجيل محلياً. سيُرفع تلقائياً عند عودة الاتصال.')
      } catch (e) {
        console.error('Failed to enqueue offline recording:', e)
        setSaveError('تعذّر حفظ التسجيل محلياً. أعِد المحاولة.')
      } finally {
        setIsSaving(false)
      }
      return
    }

    try {
      const response = await apiClient.saveNote({
        raw_text: transcriptText || '',
        patient_name: 'Untitled',
        summary: null,
        doctor_specialty: specialty
      })

      const newNoteId = (response as any).data?.id || (response as any).payload?.id

      if (newNoteId) {
        audioRecordingService.clearRecording()
        navigate(ROUTES.NOTE_DETAIL.replace(':noteId', newNoteId), { state: { autoApplyMacroId: template?.id } })
      } else {
        setSaveError('Could not save the recording. Please try again.')
      }
    } catch (error) {
      console.error('Failed to save note:', error)
      setSaveError('Could not save the recording. Please check your connection and try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 bg-[#E6EDF5]/95 dark:bg-[#0F172A]/95 backdrop-blur-md shadow-[0_-10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.3)] z-50 border-none"
        style={{ height: 'calc(3.5rem + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between px-8 h-full relative">
          {/* Inbox — left */}
          <button
            onClick={() => navigate(ROUTES.HOME)}
            aria-label="Inbox"
            className={`flex justify-center p-2 rounded-lg transition-colors ${
              isInboxActive
                ? 'text-blue-500'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </button>

          {/* Record — center, half-floating (half inside the bar, half outside) */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-[36px] flex flex-col items-center justify-center z-50">
            <div className="relative flex items-center justify-center">

              <button
                onClick={handleRecordClick}
                aria-label={isRecording ? "Stop Recording" : "Record"}
                className={`w-[72px] h-[72px] pointer-events-auto border border-slate-300/60 dark:border-none rounded-full flex items-center justify-center transition-all transform relative z-10 ${
                  isRecording 
                    ? 'bg-red-600 shadow-[0_10px_25px_rgba(239,68,68,0.5)] text-white hover:bg-red-700 scale-105' 
                    : 'bg-[#F0F4F8] dark:bg-[#1E293B] shadow-[0_10px_25px_rgba(15,23,42,0.08)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.6)] text-blue-500 dark:text-[#38BDF8] hover:bg-[#E6ECF2] dark:hover:bg-[#334155] hover:scale-105'
                }`}
              >
                {isRecording ? (
                  <div className="w-6 h-6 bg-white rounded-sm" />
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Settings gear — right (opens ProfileMenu upward) */}
          <div className="flex justify-center text-gray-400 dark:text-gray-500 p-2">
            <ProfileMenu variant="gear" openUpward />
          </div>
        </div>
      </div>

      {isRecording && (
        <ListeningModeView onCancel={handleCancelRecording} />
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
          onCancel={() => setIsSaving(false)}
        />
      )}

      {saveError && (
         <div className="fixed top-4 left-4 right-4 bg-red-100 dark:bg-red-900/40 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl z-[100] shadow-lg flex items-start space-x-2">
           <div className="flex-1 text-sm font-medium">{saveError}</div>
           <button onClick={() => setSaveError(null)} className="text-red-500 hover:text-red-700 dark:hover:text-red-200">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
         </div>
      )}
    </>
  )
}

