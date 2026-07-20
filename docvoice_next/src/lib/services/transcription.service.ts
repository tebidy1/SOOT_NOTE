import { audioService } from './audio.service'

class TranscriptionService {
  private pollingInterval: ReturnType<typeof setInterval> | null = null

  async transcribeOracle(
    audioBlob: Blob,
    language: string = 'en',
    modelType: string = 'WHISPER_LARGE_V3T',
    onStatusChange?: (status: string) => void
  ): Promise<string> {
    const uploadResponse = await audioService.transcribeOracle(audioBlob, language, modelType)

    if (!uploadResponse.success) {
      throw new Error(uploadResponse.error || 'Failed to upload audio for transcription')
    }

    const responseData = uploadResponse.data || uploadResponse
    const jobId = responseData.job_id || responseData.payload?.job_id

    if (!jobId) {
      throw new Error('No job_id received from transcription endpoint')
    }

    return new Promise((resolve, reject) => {
      let attempts = 0
      const maxAttempts = 100

      this.pollingInterval = setInterval(async () => {
        attempts++
        if (attempts >= maxAttempts) {
          if (this.pollingInterval) clearInterval(this.pollingInterval)
          this.pollingInterval = null
          reject(new Error('Transcription timed out'))
          return
        }

        try {
          const statusResponse = await audioService.getTranscriptionStatus(jobId)

          if (!statusResponse.success) {
            return
          }

          const statusData = statusResponse.data || statusResponse
          const payload = statusData.payload || statusData
          const jobStatus = payload.job_status

          onStatusChange?.(jobStatus)

          if (jobStatus === 'succeeded') {
            if (this.pollingInterval) clearInterval(this.pollingInterval)
            this.pollingInterval = null
            const transcript = payload.transcript
            if (!transcript) {
              reject(new Error('Transcription succeeded but no transcript returned'))
              return
            }
            resolve(transcript)
          } else if (jobStatus === 'failed') {
            if (this.pollingInterval) clearInterval(this.pollingInterval)
            this.pollingInterval = null
            reject(new Error('Transcription failed on backend'))
          }
        } catch {
          // Continue polling on transient errors
        }
      }, 3000)
    })
  }

  cancel(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
  }
}

export const transcriptionService = new TranscriptionService()
