import { apiClient } from './apiClient'
import { useRecordingStore } from '../store/recordingStore'
import { useSettingsStore } from '../store/settingsStore'

const CONNECTION_TIMEOUT_MS = 10000
const AUTH_TIMEOUT_MS = 10000

type RealtimeStatus = 'idle' | 'connecting' | 'authenticated' | 'error' | 'unavailable'

class OciRealtimeService {
  private ws: WebSocket | null = null
  private audioContext: AudioContext | null = null
  private scriptProcessor: ScriptProcessorNode | null = null
  private workletNode: AudioWorkletNode | null = null
  private stream: MediaStream | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private isAuthenticated: boolean = false
  private committedTranscript: string = ''
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null
  private authTimeout: ReturnType<typeof setTimeout> | null = null
  private isConnecting: boolean = false
  private endpointIndex: number = 0
  private tokenData: { token: string; region: string; compartmentId: string } | null = null

  // ── Performance tracking ──
  private wsStartTime: number = 0
  private firstAudioSentTime: number = 0
  private firstResultReceived: boolean = false
  private audioChunkCount: number = 0
  private lastChunkTime: number = 0

  // ── Token pre-fetch cache ──
  // In-memory cache dies whenever the side panel closes, so we mirror it in
  // chrome.storage.local: the first recording after reopening the panel gets
  // a warm token instead of a slow backend round-trip (RSA-sign + Oracle).
  private cachedToken: { token: string; region: string; compartmentId: string } | null = null
  private tokenFetchedAt: number = 0
  private TOKEN_MAX_AGE_MS = 50 * 60 * 1000 // 50 minutes (token valid for 1 hour)
  private TOKEN_STORAGE_KEY = 'oci_realtime_token_cache'
  private prefetchPromise: Promise<{ token: string; region: string; compartmentId: string } | null> | null = null
  private storageRestorePromise: Promise<void> | null = null

  /**
   * Pre-fetch the Oracle token in advance (call this early, e.g. on app load).
   * This way when the user presses record, the token is already available.
   */
  async prefetchToken(): Promise<void> {
    await this.restoreTokenFromStorage()

    if (this.isCachedTokenValid()) {
      console.log('⏱️ [Perf] Token already cached, skipping prefetch.')
      return
    }
    if (this.prefetchPromise) {
      // A prefetch is already in flight (e.g. panel-load + record-click) — reuse it.
      await this.prefetchPromise
      return
    }
    console.log('⏱️ [Perf] Pre-fetching Oracle token in background...')
    const startTime = performance.now()
    this.prefetchPromise = this.fetchTokenFromApi()
    const result = await this.prefetchPromise
    this.prefetchPromise = null
    if (result) {
      this.cachedToken = result
      this.tokenFetchedAt = Date.now()
      this.persistToken()
      const duration = (performance.now() - startTime).toFixed(2)
      console.log(`⏱️ [Perf] Token pre-fetched and cached in ${duration} ms`)
    }
  }

  private isCachedTokenValid(): boolean {
    return !!this.cachedToken && (Date.now() - this.tokenFetchedAt) < this.TOKEN_MAX_AGE_MS
  }

  /** Restore a still-valid token persisted by a previous side-panel session. */
  private restoreTokenFromStorage(): Promise<void> {
    if (!this.storageRestorePromise) {
      this.storageRestorePromise = (async () => {
        try {
          if (typeof chrome === 'undefined' || !chrome.storage?.local) return
          const data = await chrome.storage.local.get(this.TOKEN_STORAGE_KEY)
          const saved = data?.[this.TOKEN_STORAGE_KEY]
          if (
            !this.cachedToken &&
            saved?.token && saved.region && saved.compartmentId && saved.fetchedAt &&
            (Date.now() - saved.fetchedAt) < this.TOKEN_MAX_AGE_MS
          ) {
            this.cachedToken = { token: saved.token, region: saved.region, compartmentId: saved.compartmentId }
            this.tokenFetchedAt = saved.fetchedAt
            console.log(`⏱️ [Perf] Token restored from storage (age: ${((Date.now() - saved.fetchedAt) / 1000).toFixed(1)}s)`)
          }
        } catch {
          // storage unavailable — fall back to in-memory cache only
        }
      })()
    }
    return this.storageRestorePromise
  }

  private persistToken(): void {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage?.local || !this.cachedToken) return
      chrome.storage.local.set({
        [this.TOKEN_STORAGE_KEY]: { ...this.cachedToken, fetchedAt: this.tokenFetchedAt }
      })
    } catch { /* non-fatal */ }
  }

  private clearPersistedToken(): void {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage?.local) return
      chrome.storage.local.remove(this.TOKEN_STORAGE_KEY)
    } catch { /* non-fatal */ }
  }

  async startTranscription(stream: MediaStream): Promise<void> {
    this.stream = stream
    this.committedTranscript = ''
    this.isAuthenticated = false
    this.endpointIndex = 0
    useRecordingStore.getState().setRealtimeTranscript('')
    useRecordingStore.getState().setFinalTranscript('')
    useRecordingStore.getState().setRealtimeStatus('connecting')
    this.firstAudioSentTime = 0
    this.firstResultReceived = false
    this.audioChunkCount = 0
    this.lastChunkTime = 0

    try {
      const fetched = await this.getToken()
      if (!fetched) return
      this.tokenData = fetched
      this.tryNextEndpoint()
    } catch (error: any) {
      console.error('Failed to start OCI real-time transcription:', error)
      this.setUnavailable()
    }
  }

  private async getToken(): Promise<{ token: string; region: string; compartmentId: string } | null> {
    await this.restoreTokenFromStorage()

    // If there's an in-flight prefetch, wait for it
    if (this.prefetchPromise) {
      console.log('⏱️ [Perf] Waiting for in-flight token prefetch...')
      await this.prefetchPromise
    }

    if (this.isCachedTokenValid()) {
      console.log('⏱️ [Perf] Using cached token (age: ' + ((Date.now() - this.tokenFetchedAt) / 1000).toFixed(1) + 's)')
      const validToken = this.cachedToken
      // CRITICAL FIX: OCI tokens are single-use per session. We must consume/invalidate it now.
      this.cachedToken = null
      this.tokenFetchedAt = 0
      this.clearPersistedToken()
      return validToken
    }

    console.log('⏱️ [Perf] Cache miss — fetching fresh token...')
    const startTime = performance.now()
    const result = await this.fetchTokenFromApi()
    // Don't cache it here since we are immediately using it for the active session
    if (result) {
      const duration = (performance.now() - startTime).toFixed(2)
      console.log(`⏱️ [Perf] Fresh token fetched in ${duration} ms`)
    }
    return result
  }

  private async fetchTokenFromApi(): Promise<{ token: string; region: string; compartmentId: string } | null> {
    try {
      const response: any = await apiClient.getOracleToken()

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

      console.log('OCI Token received, region:', region)
      return { token, region, compartmentId }
    } catch (error: any) {
      console.error('Failed to fetch OCI token:', error)
      this.setUnavailable()
      return null
    }
  }

  // ─────────────────────────────────────────────────────
  // FIX: Clean URL without query parameters.
  // Oracle expects configuration as a JSON message after 
  // the WebSocket handshake, NOT as URL query params.
  // ─────────────────────────────────────────────────────
  private getEndpoints(region: string): string[] {
    return [
      `wss://realtime.aiservice.${region}.oci.oraclecloud.com/ws/transcribe/stream`,
      `wss://speech.aiservice.${region}.oci.oraclecloud.com/ws/transcribe/stream`,
    ]
  }

  /**
   * Build session configuration dynamically based on the user's selected model.
   * 
   * WHISPER mode: Multilingual (90+ languages), sends minimal config.
   * ORACLE mode:  Includes Oracle-specific tuning parameters.
   * 
   * CRITICAL: When using modelType=WHISPER, the following parameters
   * are NOT supported and will cause Oracle to reject the connection:
   *   - partialSilenceThresholdInMs
   *   - finalSilenceThresholdInMs  
   *   - stabilizePartialResults
   *   - shouldIgnoreInvalidCustomizations
   *   - customizations
   */
  private buildSessionConfig(): object {
    const config = useSettingsStore.getState().getActiveModelConfig()

    console.log(`🔊 [Model] Using: ${config.label} (${config.modelType}/${config.modelDomain}/${config.languageCode})`)

    // Base config — shared between both models
    const sessionConfig: Record<string, any> = {
      languageCode: config.languageCode,
      modelDomain: config.modelDomain,
      modelType: config.modelType,
      encoding: 'audio/raw;rate=16000',
      isAckEnabled: false,
      punctuation: 'AUTO'
    }

    // Oracle-only parameters — add ONLY when using ORACLE model
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

    console.log(`OCI connecting (${this.endpointIndex + 1}/${endpoints.length}): ${wsUrl}`)
    this.isConnecting = true
    this.cleanupWebSocket()

    this.wsStartTime = performance.now()
    this.ws = new WebSocket(wsUrl)
    this.ws.binaryType = 'arraybuffer'

    this.connectionTimeout = setTimeout(() => {
      console.warn(`Connection timeout for ${wsUrl}`)
      this.endpointIndex++
      this.tryNextEndpoint()
    }, CONNECTION_TIMEOUT_MS)

    this.ws.onopen = () => {
      this.clearConnectionTimeout()
      const openTime = (performance.now() - this.wsStartTime).toFixed(2)
      console.log(`⏱️ [Perf] WebSocket Connection (to onopen): ${openTime} ms`)
      console.log('OCI WebSocket opened — sending TOKEN auth...')

      // Step 1: Send authentication
      const authPayload = {
        authenticationType: 'TOKEN',
        compartmentId: this.tokenData!.compartmentId,
        token: this.tokenData!.token
      }
      this.ws!.send(JSON.stringify(authPayload))

      this.authTimeout = setTimeout(() => {
        console.warn('Auth timeout — no CONNECT message received')
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
        console.log('OCI WebSocket closed, code:', event.code)
        this.cleanupAudio()
        const store = useRecordingStore.getState()
        if (store.realtimeStatus === 'authenticated') {
          store.setRealtimeStatus('idle')
        }
      } else if (this.isConnecting) {
        console.warn(`WebSocket closed before auth (code ${event.code}, reason: "${event.reason || 'none'}")`)
        this.endpointIndex++
        this.tryNextEndpoint()
      }
    }

    this.ws.onerror = () => {
      this.clearConnectionTimeout()
      this.clearAuthTimeout()

      if (this.isConnecting && !this.isAuthenticated) {
        console.warn('WebSocket error before auth — trying next endpoint')
        this.endpointIndex++
        this.tryNextEndpoint()
      }
    }
  }

  private setUnavailable() {
    this.isConnecting = false
    this.cleanupWebSocket()
    console.warn('⚠️ [FALLBACK ALERT] OCI Realtime Speech unavailable! WebSocket failed or disconnected. System is silently falling back to slow Batch processing method.')
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
      console.log('OCI Message:', message.event, message.code ? `(code: ${message.code})` : '')

      switch (message.event) {
        case 'CONNECT':
          this.clearAuthTimeout()
          console.log('OCI CONNECT — authenticated successfully')
          this.isAuthenticated = true
          this.isConnecting = false
          useRecordingStore.getState().setRealtimeStatus('authenticated')
          
          // Step 2: Send session configuration as JSON (after auth)
          const sessionConfig = this.buildSessionConfig()
          console.log('Sending session config:', JSON.stringify(sessionConfig))
          this.ws!.send(JSON.stringify(sessionConfig))
          
          // Step 3: Start streaming audio
          this.startAudioStreaming()
          break

        case 'RESULT':
          if (!this.firstResultReceived && this.firstAudioSentTime > 0) {
            const latency = (performance.now() - this.firstAudioSentTime).toFixed(2)
            console.log(`⏱️ [Perf] Oracle Response Latency (First audio sent -> First RESULT): ${latency} ms`)
            this.firstResultReceived = true
          }
          this.handleTranscriptionResult(message)
          break

        case 'ACKAUDIO':
          break

        case 'ERROR':
          this.clearAuthTimeout()
          console.error('OCI ERROR:', message.code, message.message)
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

    const fullDisplay = this.committedTranscript + (this.committedTranscript && partialText ? ' ' : '') + partialText
    store.setRealtimeTranscript(fullDisplay)

    if (this.committedTranscript) {
      store.setFinalTranscript(this.committedTranscript)
    }
  }

  private async startAudioStreaming() {
    if (!this.stream || !this.isAuthenticated) return

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      })

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(this.stream)

      // ── Preferred path: AudioWorklet ──
      // Runs on the dedicated audio rendering thread, so UI work (animations,
      // live-transcript re-renders) can never delay or drop mic frames.
      try {
        const workletUrl = chrome.runtime.getURL('pcm-worklet.js')
        await this.audioContext.audioWorklet.addModule(workletUrl)
        this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-processor', {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          channelCount: 1
        })
        this.workletNode.port.onmessage = (event: MessageEvent) => {
          this.sendPcmChunk(event.data as ArrayBuffer)
        }
        this.sourceNode.connect(this.workletNode)
        this.workletNode.connect(this.audioContext.destination)
        console.log('Audio streaming started — AudioWorklet, 16kHz PCM, chunk=1024')
        return
      } catch (workletError) {
        console.warn('AudioWorklet unavailable — falling back to ScriptProcessorNode:', workletError)
      }

      // ── Fallback: deprecated ScriptProcessorNode (main thread) ──
      this.scriptProcessor = this.audioContext.createScriptProcessor(1024, 1, 1)
      this.scriptProcessor.onaudioprocess = (event) => {
        if (!this.isAuthenticated || !this.ws || this.ws.readyState !== WebSocket.OPEN) return
        const inputData = event.inputBuffer.getChannelData(0)
        this.sendPcmChunk(this.floatTo16BitPCM(inputData))
      }
      this.sourceNode.connect(this.scriptProcessor)
      this.scriptProcessor.connect(this.audioContext.destination)
      console.log('Audio streaming started — ScriptProcessor fallback, 16kHz PCM, bufferSize=1024')
    } catch (error) {
      console.error('Failed to start audio streaming:', error)
    }
  }

  private sendPcmChunk(pcmData: ArrayBuffer) {
    if (!this.isAuthenticated || !this.ws || this.ws.readyState !== WebSocket.OPEN) return

    if (this.audioChunkCount === 0) {
      this.firstAudioSentTime = performance.now()
      this.lastChunkTime = this.firstAudioSentTime
      console.log(`⏱️ [Perf] First Audio Chunk Sent. Bytes: ${pcmData.byteLength}`)
    } else if (this.audioChunkCount % 50 === 0) {
      const now = performance.now()
      const diff = now - this.lastChunkTime
      console.log(`⏱️ [Perf] Audio Chunking: chunk ${this.audioChunkCount}. Time for last 50 chunks: ${diff.toFixed(2)} ms.`)
      this.lastChunkTime = now
    }
    this.audioChunkCount++

    this.ws.send(pcmData)
  }

  private floatTo16BitPCM(input: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(input.length * 2)
    const view = new DataView(buffer)
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]))
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
    }
    return buffer
  }

  private cleanupAudio() {
    if (this.workletNode) {
      this.workletNode.port.onmessage = null
      this.workletNode.disconnect()
      this.workletNode = null
    }
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
      try { this.ws.close() } catch (e) {}
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

  stopTranscription() {
    this.clearConnectionTimeout()
    this.clearAuthTimeout()
    this.isConnecting = false
    this.requestFinalResult()

    this.cleanupWebSocket()
    this.cleanupAudio()
    this.stream = null
    this.committedTranscript = ''
    this.tokenData = null
    useRecordingStore.getState().setRealtimeStatus('idle')
    console.log('Real-time transcription stopped')

    // Automatically prefetch a fresh token for the next session to maintain 0-latency starts
    this.prefetchToken().catch(e => console.error('Prefetch failed:', e))
  }
}

export const ociRealtimeService = new OciRealtimeService()
