import { useRecordingStore } from '../store/recordingStore'
import { ociRealtimeService } from './ociRealtimeService'

class AudioRecordingService {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null
  private recordingStartTime: number = 0
  private durationInterval: ReturnType<typeof setInterval> | null = null

  async startRecording(): Promise<void> {
    try {
      const store = useRecordingStore.getState()
      store.setError(null)

      // ── OPTIMIZATION: warm the OCI token fully in the background ──
      // Fire-and-forget: startTranscription() awaits the in-flight prefetch
      // internally (getToken), so we must NOT block mic startup — and the
      // recording indicator — on this network call.
      ociRealtimeService.prefetchToken().catch(() => {})

      // Only check for a hard "denied" state. When state is "prompt", the real
      // getUserMedia below triggers the permission dialog itself — no need for
      // a second, throw-away getUserMedia probe (double mic acquisition).
      const permissionState = await this.getPermissionState()
      if (permissionState === 'denied') {
        const err = new Error('Microphone permission required')
        err.name = 'NotAllowedError'
        store.setError('Microphone permission denied. Please allow microphone access in Chrome settings and try again.')
        throw err
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      this.audioChunks = []
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = () => {
      }

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        store.setError('Recording error occurred')
      }

      this.mediaRecorder.start(100)
      store.startRecording()

      // Light haptic tick on record start where supported (mobile Chrome/Android).
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(15)

      // Skip live OCI transcription when offline — it needs a WebSocket to
      // *.oci.oraclecloud.com. The audio is still captured locally and gets
      // queued in stopRecording() for async transcription on reconnect.
      const online = typeof navigator === 'undefined' ? true : navigator.onLine
      if (online) {
        ociRealtimeService.startTranscription(this.stream).catch(err => {
          console.error('Failed to start real-time transcription:', err)
        })
      }

      this.recordingStartTime = Date.now()
      this.startDurationTimer()
      
      console.log('Recording started')
    } catch (error: any) {
      console.error('Failed to start recording:', error)
      useRecordingStore.getState().setError(
        error.name === 'NotAllowedError' 
          ? 'Microphone permission denied. Please allow microphone access in Chrome settings and try again.'
          : 'Failed to access microphone'
      )
      throw error
    }
  }

  private async getPermissionState(): Promise<'granted' | 'denied' | 'prompt'> {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      return result.state as 'granted' | 'denied' | 'prompt'
    } catch {
      return 'prompt'
    }
  }

  private async requestMicrophonePermission(): Promise<boolean> {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      if (result.state === 'granted') return true
      if (result.state === 'denied') {
        console.warn('Microphone permission is denied. User must change it in Chrome settings.')
        return false
      }
    } catch {
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        console.warn('User dismissed or denied the microphone permission prompt')
      }
      return false
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
          const store = useRecordingStore.getState()
          store.stopRecording()
          this.stopDurationTimer()
          this.cleanupStream()
          reject(new Error('No active recording'))
          return
        }

        const store = useRecordingStore.getState()
        
        this.mediaRecorder.onstop = () => {
          const chunks = [...this.audioChunks]
          this.cleanupStream()
          
          ociRealtimeService.stopTranscription()

          const audioBlob = new Blob(chunks, { type: 'audio/webm' })
          store.setAudioBlob(audioBlob)
          
          const audioUrl = URL.createObjectURL(audioBlob)
          store.setAudioUrl(audioUrl)
          
          resolve(audioBlob)
        }

        this.mediaRecorder.stop()
        this.stopDurationTimer()
        store.stopRecording()

        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(15)

        console.log('Recording stopped')
      } catch (error) {
        console.error('Failed to stop recording:', error)
        useRecordingStore.getState().setError('Failed to stop recording')
        reject(error)
      }
    })
  }

  private cleanupStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    this.mediaRecorder = null
    this.audioChunks = []
  }

  private startDurationTimer(): void {
    this.durationInterval = setInterval(() => {
      const duration = Math.floor((Date.now() - this.recordingStartTime) / 1000)
      useRecordingStore.getState().setDuration(duration)
    }, 1000)
  }

  private stopDurationTimer(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval)
      this.durationInterval = null
    }
  }

  getStream(): MediaStream | null {
    return this.stream
  }

  getRecordingState() {
    const store = useRecordingStore.getState()
    return {
      isRecording: store.isRecording,
      duration: store.duration,
      audioBlob: store.audioBlob,
      audioUrl: store.audioUrl,
      error: store.error
    }
  }

  clearRecording(): void {
    const store = useRecordingStore.getState()
    
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop()
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    
    if (this.durationInterval) {
      clearInterval(this.durationInterval)
      this.durationInterval = null
    }
    
    this.audioChunks = []
    this.mediaRecorder = null
    
    ociRealtimeService.stopTranscription()
    store.clearRecording()
    
    console.log('Recording cleared')
  }

  async getMicrophonePermission(): Promise<boolean> {
    return this.requestMicrophonePermission()
  }
}

export const audioRecordingService = new AudioRecordingService()
