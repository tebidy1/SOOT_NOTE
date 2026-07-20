import { baseApi } from './base.service'

const axiosInstance = baseApi.getAxiosInstance()

export const audioService = {
  async getOracleToken(): Promise<any> {
    try {
      const response = await axiosInstance.get('/audio/oracle-token', {
        timeout: 15000,
      })
      return response.data
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to fetch Oracle token',
      }
    }
  },

  async transcribeOracle(
    audioBlob: Blob,
    language: string = 'en',
    modelType: string = 'WHISPER_LARGE_V3T'
  ): Promise<any> {
    try {
      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.webm')
      formData.append('language', language)
      formData.append('model_type', modelType)

      const response = await axiosInstance.post(
        '/audio/transcribe-oracle',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
        }
      )
      return response.data
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to upload audio for transcription',
      }
    }
  },

  async getTranscriptionStatus(jobId: string): Promise<any> {
    try {
      const response = await axiosInstance.get(
        `/audio/transcription-status/${jobId}`
      )
      return response.data
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to fetch transcription status',
      }
    }
  },
}

export default audioService
