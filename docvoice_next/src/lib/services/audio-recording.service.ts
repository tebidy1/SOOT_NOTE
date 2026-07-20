import { useRecordingStore } from '@/stores/recording-store'
import { ociRealtimeService } from './oci-realtime.service'

const SUPPORTED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
  'audio/mpeg',
]

const PERMISSION_DENIED_MESSAGE =
  'تم رفض إذن الميكروفون. يرجى السماح بالوصول للميكروفون من إعدادات المتصفح والمحاولة مرة أخرى.'
const MIC_ACCESS_FAILED_MESSAGE = 'فشل الوصول إلى الميكروفون. تأكد من اتصاله وصلاحية الإذن.'
const RECORDING_ERROR_MESSAGE = 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.'
const STOP_FAILED_MESSAGE = 'فشل إيقاف التسجيل.'

class AudioRecordingService {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null
  private recordingStartTime: number = 0
  private durationInterval: ReturnType<typeof setInterval> | null = null
  private mimeType: string = 'audio/webm'

  async startRecording(): Promise<void> {
    try {
      const store = useRecordingStore.getState()
      store.setError(null)
      store.setStarting(true)

      const tokenPrefetchPromise = ociRealtimeService.prefetchToken()

      const hasPermission = await this.requestMicrophonePermission()
      if (!hasPermission) {
        const err = new Error('Microphone permission required')
        err.name = 'NotAllowedError'
        store.setStarting(false)
        store.setError(PERMISSION_DENIED_MESSAGE)
        throw err
      }

      await tokenPrefetchPromise

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      this.mimeType = this.getSupportedMimeType()

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.mimeType,
      })

      this.audioChunks = []

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        useRecordingStore.getState().setError(RECORDING_ERROR_MESSAGE)
      }

      this.mediaRecorder.start(100)
      this.recordingStartTime = Date.now()

      store.startRecording()
      this.startDurationTimer()

      ociRealtimeService.startTranscription(this.stream).catch((err) => {
        console.error('Failed to start real-time transcription:', err)
      })
    } catch (error: any) {
      console.error('Failed to start recording:', error)
      const store = useRecordingStore.getState()
      store.setStarting(false)
      store.setError(
        error?.name === 'NotAllowedError' ? PERMISSION_DENIED_MESSAGE : MIC_ACCESS_FAILED_MESSAGE
      )
      throw error
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const store = useRecordingStore.getState()

      try {
        if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
          store.stopRecording()
          store.setStopping(false)
          this.stopDurationTimer()
          this.cleanupStream()
          reject(new Error('No active recording'))
          return
        }

        store.setStopping(true)

        this.mediaRecorder.onstop = () => {
          const chunks = [...this.audioChunks]
          this.cleanupStream()

          ociRealtimeService.stopTranscription()

          const audioBlob = new Blob(chunks, { type: this.mimeType })
          store.setAudioBlob(audioBlob, this.mimeType)

          const audioUrl = URL.createObjectURL(audioBlob)
          store.setAudioUrl(audioUrl)

          store.setStopping(false)
          resolve(audioBlob)
        }

        this.mediaRecorder.stop()
        this.stopDurationTimer()
        store.stopRecording()
      } catch (error) {
        console.error('Failed to stop recording:', error)
        store.setStopping(false)
        store.setError(STOP_FAILED_MESSAGE)
        reject(error)
      }
    })
  }

  private getSupportedMimeType(): string {
    if (typeof MediaRecorder === 'undefined') return 'audio/webm'
    for (const type of SUPPORTED_MIME_TYPES) {
      if (MediaRecorder.isTypeSupported(type)) return type
    }
    return 'audio/webm'
  }

  private async requestMicrophonePermission(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return false

    try {
      const result = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      })
      if (result.state === 'granted') return true
      if (result.state === 'denied') return false
    } catch {
      // permissions API غير مدعومة، ننتقل إلى getUserMedia
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      return true
    } catch {
      return false
    }
  }

  private cleanupStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
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

  clearRecording(): void {
    const store = useRecordingStore.getState()

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop()
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }

    if (this.durationInterval) {
      clearInterval(this.durationInterval)
      this.durationInterval = null
    }

    const { audioUrl } = store
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }

    this.audioChunks = []
    this.mediaRecorder = null

    ociRealtimeService.stopTranscription()
    store.clearRecording()
  }

  getMicrophonePermission(): Promise<boolean> {
    return this.requestMicrophonePermission()
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  getFileExtension(): string {
    if (this.mimeType.includes('webm')) return 'webm'
    if (this.mimeType.includes('ogg')) return 'ogg'
    if (this.mimeType.includes('mp4')) return 'mp4'
    if (this.mimeType.includes('mpeg')) return 'mp3'
    return 'webm'
  }
}

export const audioRecordingService = new AudioRecordingService()
