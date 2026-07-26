import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useRecordingStore } from '../../store/recordingStore'
import { useSettingsStore } from '../../store/settingsStore'
import { audioRecordingService } from '../../services/audioRecordingService'
import { ociRealtimeService } from '../../services/ociRealtimeService'
import ProcessingOverlay, { NOTE_PROCESSING_STEPS } from '../components/ProcessingOverlay'
import { ROUTES } from '../routes'
import AnimatedRecordButton from '../components/AnimatedRecordButton'
import BottomNav from '../components/BottomNav'
import Logo from '../components/Logo'

import { apiClient } from '../../services/apiClient'

export default function HomeScreen() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { isRecording } = useRecordingStore()
  const { theme } = useSettingsStore()
  const [showListeningMode, setShowListeningMode] = useState(false)
  const [showTemplateSheet, setShowTemplateSheet] = useState(false)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

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
    }
  }

  const handleTemplateSelect = async (template: any) => {
    setShowTemplateSheet(false)
    setIsSaving(true)
    setSaveError(null)

    const store = useRecordingStore.getState()
    const transcriptText = (store.finalTranscript || store.realtimeTranscript || '').trim()

    // Guard: never create a note from an empty transcript. This happens when
    // the live Oracle transcription dropped mid-session (WebSocket/auth failure
    // → realtimeStatus 'unavailable'/'error') and nothing was captured. Saving
    // a blank note would only fail later at template time with an opaque
    // "Note has no text content" error, after the doctor already picked a
    // template — so we stop here with a clear, actionable message instead.
    if (!transcriptText) {
      setIsSaving(false)
      setSaveError(
        'No speech was captured — the live transcription may have been interrupted. ' +
        'Please check your connection and record again.'
      )
      return
    }

    try {
      const response = await apiClient.saveNote({
        raw_text: transcriptText,
        patient_name: 'Untitled',
        summary: null,
        doctor_specialty: useSettingsStore.getState().doctorSpecialty
      })

      const newNoteId = (response as any).data?.id || (response as any).payload?.id

      if (newNoteId) {
        audioRecordingService.clearRecording()
        navigate(ROUTES.NOTE_DETAIL.replace(':noteId', newNoteId), { state: { autoApplyMacroId: template.id } })
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

  const handleCancelRecording = () => {
    audioRecordingService.clearRecording()
    setShowListeningMode(false)
  }

  return (
    <div className="min-h-screen bg-[#E6EDF5] dark:from-[#0F172A] dark:to-[#0F172A] dark:bg-[#0F172A] flex flex-col transition-colors duration-200">
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center justify-center mb-8">
          <Logo className="h-12 w-auto" variant={theme === 'dark' ? 'light' : 'dark'} />
        </div>

        <div className="mb-8 bg-gradient-to-r from-blue-600 to-teal-500 dark:from-[#1E293B] dark:to-[#1E293B] dark:border dark:border-slate-800/80 rounded-xl p-4 text-white dark:text-slate-200 shadow-md">
          <h2 className="text-lg font-bold">Welcome back, {user?.name || 'Doctor'}</h2>
          <p className="text-xs text-blue-100 dark:text-slate-400 mt-0.5">Ready for voice documentation?</p>
        </div>

        {saveError && (
          <div className="mb-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg px-4 py-3 flex items-start space-x-2">
            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-700 dark:text-red-400">{saveError}</p>
              <button
                onClick={() => setSaveError(null)}
                className="text-xs text-red-600 dark:text-red-400 underline hover:text-red-800 dark:hover:text-red-300 mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-end text-center pb-12">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">Start a new recording session</div>
          <AnimatedRecordButton
            isRecording={isRecording}
            onClick={handleRecordClick}
            size="large"
          />
          <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
            {isRecording
              ? 'Recording in progress...'
              : 'Tap to start voice documentation'}
          </p>
        </div>
      </div>

      <BottomNav activeRoute="record" />

      {showPermissionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#F0F4F8] dark:bg-[#1E293B] border border-slate-300/70 dark:border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-red-600 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Microphone Access Required</h3>
              {permissionStatus === 'denied' ? (
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p>Microphone access is blocked. To enable it:</p>
                  <ol className="text-left list-decimal list-inside space-y-1 bg-gray-50 dark:bg-[#0F172A] p-3 rounded-lg text-gray-700 dark:text-gray-300">
                    <li>Click the lock/icon in the address bar</li>
                    <li>Find "Microphone" permission</li>
                    <li>Change it to "Allow"</li>
                    <li>Reload the extension</li>
                  </ol>
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  SoutNote needs access to your microphone to record voice notes. Please allow microphone access when prompted.
                </p>
              )}
            </div>
            {permissionStatus === 'denied' ? (
              <button
                onClick={() => setShowPermissionModal(false)}
                className="w-full py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
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
                  className="w-full py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
