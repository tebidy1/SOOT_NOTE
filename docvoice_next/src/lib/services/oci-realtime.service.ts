import { audioService } from './audio.service'
import { useRecordingStore } from '@/stores/recording-store'

const CONNECTION_TIMEOUT_MS = 10000
const AUTH_TIMEOUT_MS = 10000

const WHISPER_MODEL_CONFIG = {
  modelType: 'WHISPER',
  modelDomain: 'GENERIC',
  languageCode: 'en',
}

type RealtimeStatus = 'idle' | 'connecting' | 'authenticated' | 'error' | 'unavailable'

class OciRealtimeService {
  private ws: WebSocket | null = null
  private audioContext: AudioContext | null = null
  private scriptProcessor: ScriptProcessorNode | null = null
  private stream: MediaStream | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private isAuthenticated = false
  private committedTranscript = ''
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null
  private authTimeout: ReturnType<typeof setTimeout> | null = null
  private isConnecting = false
  private endpointIndex = 0
  private tokenData: { token: string; region: string; compartmentId: string } | null = null

  private cachedToken: { token: string; region: string; compartmentId: string } | null = null
  private tokenFetchedAt = 0
  private readonly TOKEN_MAX_AGE_MS = 50 * 60 * 1000
  private prefetchPromise: Promise<{ token: string; region: string; compartmentId: string } | null> | null = null

  async prefetchToken(): Promise<void> {
    if (this.isCachedTokenValid()) return
    this.prefetchPromise = this.fetchTokenFromApi()
    const result = await this.prefetchPromise
    this.prefetchPromise = null
    if (result) {
      this.cachedToken = result
      this.tokenFetchedAt = Date.now()
    }
  }

  private isCachedTokenValid(): boolean {
    return !!this.cachedToken && Date.now() - this.tokenFetchedAt < this.TOKEN_MAX_AGE_MS
  }

  async startTranscription(stream: MediaStream): Promise<void> {
    this.stream = stream
    this.committedTranscript = ''
    this.isAuthenticated = false
    this.endpointIndex = 0
    const store = useRecordingStore.getState()
    store.setRealtimeTranscript('')
    store.setFinalTranscript('')
    store.setRealtimeStatus('connecting')

    try {
      const fetched = await this.getToken()
      if (!fetched) return
      this.tokenData = fetched
      this.tryNextEndpoint()
    } catch (error) {
      console.error('Failed to start OCI real-time transcription:', error)
      this.setUnavailable()
    }
  }

  private async getToken(): Promise<{ token: string; region: string; compartmentId: string } | null> {
    if (this.prefetchPromise) {
      await this.prefetchPromise
    }

    if (this.isCachedTokenValid()) {
      const validToken = this.cachedToken
      this.cachedToken = null
      this.tokenFetchedAt = 0
      return validToken
    }

    return this.fetchTokenFromApi()
  }

  private async fetchTokenFromApi(): Promise<{ token: string; region: string; compartmentId: string } | null> {
    try {
      const response: any = await audioService.getOracleToken()

      if (response && response.success === false) {
        console.error('Oracle token API returned error:', response.error)
        this.setUnavailable()
        return null
      }

      const token = response.data?.token || response.token
      const region = response.data?.region || response.region
      const compartmentId = response.data?.compartmentId || response.compartmentId

      if (!token || !region || !compartmentId) {
        console.error('Missing OCI fields:', JSON.stringify(response).substring(0, 300))
        this.setUnavailable()
        return null
      }

      return { token, region, compartmentId }
    } catch (error) {
      console.error('Failed to fetch OCI token:', error)
      this.setUnavailable()
      return null
    }
  }

  private getEndpoints(region: string): string[] {
    return [
      `wss://realtime.aiservice.${region}.oci.oraclecloud.com/ws/transcribe/stream`,
      `wss://speech.aiservice.${region}.oci.oraclecloud.com/ws/transcribe/stream`,
    ]
  }

  private buildSessionConfig(): Record<string, any> {
    const config = WHISPER_MODEL_CONFIG

    const sessionConfig: Record<string, any> = {
      languageCode: config.languageCode,
      modelDomain: config.modelDomain,
      modelType: config.modelType,
      encoding: 'audio/raw;rate=16000',
      isAckEnabled: false,
      punctuation: 'AUTO',
    }

    if (config.modelType === 'ORACLE') {
      sessionConfig.partialSilenceThresholdInMs = 1000
      sessionConfig.finalSilenceThresholdInMs = 2000
      sessionConfig.stabilizePartialResults = 'MEDIUM'
    }

    return sessionConfig
  }

  private tryNextEndpoint() {
    if (!this.tokenData) {
      this.setUnavailable()
      return
    }

    const endpoints = this.getEndpoints(this.tokenData.region)

    if (this.endpointIndex >= endpoints.length) {
      console.warn('All OCI realtime endpoints failed for region:', this.tokenData.region)
      this.setUnavailable()
      return
    }

    const wsUrl = endpoints[this.endpointIndex]
    this.isConnecting = true
    this.cleanupWebSocket()

    this.ws = new WebSocket(wsUrl)
    this.ws.binaryType = 'arraybuffer'

    this.connectionTimeout = setTimeout(() => {
      this.endpointIndex++
      this.tryNextEndpoint()
    }, CONNECTION_TIMEOUT_MS)

    this.ws.onopen = () => {
      this.clearConnectionTimeout()

      const authPayload = {
        authenticationType: 'TOKEN',
        compartmentId: this.tokenData!.compartmentId,
        token: this.tokenData!.token,
      }
      this.ws!.send(JSON.stringify(authPayload))

      this.authTimeout = setTimeout(() => {
        this.endpointIndex++
        this.tryNextEndpoint()
      }, AUTH_TIMEOUT_MS)
    }

    this.ws.onmessage = (event) => {
      this.handleMessage(event)
    }

    this.ws.onclose = (event) => {
      this.clearConnectionTimeout()
      this.clearAuthTimeout()

      if (this.isAuthenticated) {
        this.cleanupAudio()
        const store = useRecordingStore.getState()
        if (store.realtimeStatus === 'authenticated') {
          store.setRealtimeStatus('idle')
        }
      } else if (this.isConnecting) {
        this.endpointIndex++
        this.tryNextEndpoint()
      }
    }

    this.ws.onerror = () => {
      this.clearConnectionTimeout()
      this.clearAuthTimeout()

      if (this.isConnecting && !this.isAuthenticated) {
        this.endpointIndex++
        this.tryNextEndpoint()
      }
    }
  }

  private setUnavailable() {
    this.isConnecting = false
    this.cleanupWebSocket()
    console.warn('OCI Realtime Speech unavailable — falling back to batch transcription.')
    useRecordingStore.getState().setRealtimeStatus('unavailable')
  }

  private clearConnectionTimeout() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }
  }

  private clearAuthTimeout() {
    if (this.authTimeout) {
      clearTimeout(this.authTimeout)
      this.authTimeout = null
    }
  }

  private handleMessage(event: MessageEvent) {
    if (typeof event.data !== 'string') return

    try {
      const message = JSON.parse(event.data)

      switch (message.event) {
        case 'CONNECT':
          this.clearAuthTimeout()
          this.isAuthenticated = true
          this.isConnecting = false
          useRecordingStore.getState().setRealtimeStatus('authenticated')

          this.ws!.send(JSON.stringify(this.buildSessionConfig()))
          this.startAudioStreaming()
          break

        case 'RESULT':
          this.handleTranscriptionResult(message)
          break

        case 'ACKAUDIO':
          break

        case 'ERROR':
          this.clearAuthTimeout()
          this.isConnecting = false
          useRecordingStore.getState().setRealtimeStatus('error')
          break
      }
    } catch (e) {
      console.error('Failed to parse OCI message:', e)
    }
  }

  private handleTranscriptionResult(message: any) {
    const store = useRecordingStore.getState()
    const transcriptions = message.transcriptions || []

    let partialText = ''

    transcriptions.forEach((t: any) => {
      if (t.isFinal) {
        if (this.committedTranscript && !this.committedTranscript.endsWith(' ')) {
          this.committedTranscript += ' '
        }
        this.committedTranscript += t.transcription
      } else {
        partialText = t.transcription
      }
    })

    const fullDisplay =
      this.committedTranscript +
      (this.committedTranscript && partialText ? ' ' : '') +
      partialText
    store.setRealtimeTranscript(fullDisplay)

    if (this.committedTranscript) {
      store.setFinalTranscript(this.committedTranscript)
    }
  }

  private startAudioStreaming() {
    if (!this.stream || !this.isAuthenticated) return

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      })

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(this.stream)
      this.scriptProcessor = this.audioContext.createScriptProcessor(1024, 1, 1)

      this.scriptProcessor.onaudioprocess = (event) => {
        if (!this.isAuthenticated || !this.ws || this.ws.readyState !== WebSocket.OPEN) return

        const inputData = event.inputBuffer.getChannelData(0)
        const pcmData = this.floatTo16BitPCM(inputData)

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(pcmData)
        }
      }

      this.sourceNode.connect(this.scriptProcessor)
      this.scriptProcessor.connect(this.audioContext.destination)
    } catch (error) {
      console.error('Failed to start audio streaming:', error)
    }
  }

  private floatTo16BitPCM(input: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(input.length * 2)
    const view = new DataView(buffer)
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]))
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    }
    return buffer
  }

  private cleanupAudio() {
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect()
      this.scriptProcessor = null
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect()
      this.sourceNode = null
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {})
      this.audioContext = null
    }
    this.isAuthenticated = false
  }

  private cleanupWebSocket() {
    if (this.ws) {
      this.ws.onopen = null
      this.ws.onmessage = null
      this.ws.onclose = null
      this.ws.onerror = null
      try {
        this.ws.close()
      } catch (e) {}
      this.ws = null
    }
  }

  requestFinalResult() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ event: 'SEND_FINAL_RESULT' }))
      } catch (e) {
        console.error('Failed to request final result:', e)
      }
    }
  }

  async stopAndWait(maxWaitMs = 3000): Promise<string> {
    const store = useRecordingStore.getState()
    const currentFinal = this.committedTranscript || store.finalTranscript || store.realtimeTranscript

    this.requestFinalResult()

    await new Promise((resolve) => setTimeout(resolve, maxWaitMs))

    const finalAfterWait = this.committedTranscript || currentFinal
    if (finalAfterWait && !store.finalTranscript) {
      store.setFinalTranscript(finalAfterWait)
    }
    if (finalAfterWait && !store.realtimeTranscript) {
      store.setRealtimeTranscript(finalAfterWait)
    }

    this.cleanupWebSocket()
    this.stream = null
    this.committedTranscript = ''
    this.tokenData = null
    useRecordingStore.getState().setRealtimeStatus('idle')

    this.prefetchToken().catch((e) => console.error('Prefetch failed:', e))

    return finalAfterWait || ''
  }

  stopTranscription() {
    this.clearConnectionTimeout()
    this.clearAuthTimeout()
    this.isConnecting = false

    const store = useRecordingStore.getState()

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ event: 'SEND_FINAL_RESULT' }))
      } catch (e) {
        console.error('Failed to request final result:', e)
      }
    }

    const currentFinal = this.committedTranscript || store.finalTranscript || store.realtimeTranscript

    this.cleanupAudio()
    this.stream = null
    this.committedTranscript = ''
    this.tokenData = null

    if (currentFinal && !store.finalTranscript) {
      store.setFinalTranscript(currentFinal)
    }
    if (currentFinal && !store.realtimeTranscript) {
      store.setRealtimeTranscript(currentFinal)
    }

    useRecordingStore.getState().setRealtimeStatus('idle')

    this.prefetchToken().catch((e) => console.error('Prefetch failed:', e))
  }
}

export const ociRealtimeService = new OciRealtimeService()
