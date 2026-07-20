// PCM capture worklet — runs on the dedicated audio rendering thread,
// isolated from the UI thread, so side-panel animations and React updates
// can never delay or drop microphone frames (better transcription accuracy).
//
// Converts Float32 mic samples to 16-bit little-endian PCM and posts
// fixed-size chunks (1024 samples ≈ 64 ms @ 16 kHz) to the main thread,
// which forwards them over the OCI Realtime WebSocket.
class PcmProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.chunkSize = 1024
    this.buffer = new Int16Array(this.chunkSize)
    this.offset = 0
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0]
    if (!channel) return true

    for (let i = 0; i < channel.length; i++) {
      const s = Math.max(-1, Math.min(1, channel[i]))
      this.buffer[this.offset++] = s < 0 ? s * 0x8000 : s * 0x7fff
      if (this.offset === this.chunkSize) {
        // Transfer the underlying buffer (zero-copy), then reallocate.
        this.port.postMessage(this.buffer.buffer, [this.buffer.buffer])
        this.buffer = new Int16Array(this.chunkSize)
        this.offset = 0
      }
    }
    return true
  }
}

registerProcessor('pcm-processor', PcmProcessor)
