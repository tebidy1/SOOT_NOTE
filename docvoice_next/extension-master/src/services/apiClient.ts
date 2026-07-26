import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiResponse, LoginResponse, OracleTranscriptionResponse, TranscriptionStatusResponse, InboxResponse } from '../types/api'
import { CreateNoteData } from '../types/note'
import { useAuthStore } from '../store/authStore'
import { platform } from '../platform'

const API_BASE_URL = 'http://127.0.0.1:8002/api'

class ApiClient {
  private client: AxiosInstance
  private static instance: ApiClient

  private constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.setupInterceptors()
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient()
    }
    return ApiClient.instance
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          useAuthStore.getState().logout()
          platform.storage.remove(['authToken', 'user'])
        }
        return Promise.reject(error)
      }
    )
  }

  private async request<T = any>(
    config: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client(config)
      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      return {
        success: false,
        error: error.message || 'Network error'
      }
    }
  }

  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const response = await this.request<any>({
      method: 'POST',
      url: '/auth/login',
      data: { email, password, device_name: 'Chrome Extension' }
    })

    if (response.success && !response.data && (response as any).token) {
      return {
        success: true,
        data: {
          user: (response as any).user,
          token: (response as any).token,
          expiresIn: 86400
        }
      }
    }

    return response
  }

  async logout(): Promise<ApiResponse> {
    return this.request({
      method: 'POST',
      url: '/auth/logout'
    })
  }

  async transcribeOracle(audioBlob: Blob, language: string = 'en', modelType: string = 'WHISPER_LARGE_V3T'): Promise<ApiResponse<OracleTranscriptionResponse>> {
    const formData = new FormData()
    formData.append('file', audioBlob, 'recording.webm')
    formData.append('language', language)
    formData.append('model_type', modelType)

    return this.request({
      method: 'POST',
      url: '/audio/transcribe-oracle',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  async getTranscriptionStatus(jobId: string): Promise<ApiResponse<TranscriptionStatusResponse>> {
    return this.request({
      method: 'GET',
      url: `/audio/transcription-status/${jobId}`
    })
  }

  async saveNote(data: CreateNoteData): Promise<ApiResponse<any>> {
    return this.request({
      method: 'POST',
      url: '/inbox-notes',
      data
    })
  }

  async getInbox(page = 1, limit = 20): Promise<ApiResponse<InboxResponse>> {
    return this.request({
      method: 'GET',
      url: '/inbox-notes',
      params: { page, limit }
    })
  }

  async getNote(noteId: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: `/inbox-notes/${noteId}`
    })
  }

  async deleteNote(noteId: string): Promise<ApiResponse> {
    return this.request({
      method: 'DELETE',
      url: `/inbox-notes/${noteId}`
    })
  }

  async getTemplates(): Promise<ApiResponse<any[]>> {
    return this.request({
      method: 'GET',
      url: '/templates'
    })
  }

  async getMacros(): Promise<ApiResponse<any[]>> {
    return this.request({
      method: 'GET',
      url: '/macros'
    })
  }

  async applyMacro(noteId: string, macroId: number, mode: 'fast' | 'precise' = 'fast'): Promise<ApiResponse<any>> {
    return this.request({
      method: 'POST',
      url: `/inbox-notes/${noteId}/apply-macro`,
      data: { macro_id: macroId, mode }
    })
  }

  async updateNoteStatus(noteId: string, status: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'PATCH',
      url: `/inbox-notes/${noteId}`,
      data: { status }
    })
  }

  async getOracleToken(): Promise<ApiResponse<{ token: string; region: string; compartmentId: string }>> {
    const startTime = performance.now()
    const response = await this.request({
      method: 'GET',
      url: '/audio/oracle-token'
    })
    const duration = (performance.now() - startTime).toFixed(2)
    console.log(`⏱️ [Perf] Token Fetch: ${duration} ms`)
    return response
  }

  async initiatePairing(): Promise<ApiResponse<{ pairing_id: string; short_code: string; expires_in: number }>> {
    const response = await this.request({
      method: 'GET',
      url: '/pairing/initiate'
    })

    if (response.success && !response.data && (response as any).pairing_id) {
      return {
        success: true,
        data: {
          pairing_id: (response as any).pairing_id,
          short_code: (response as any).short_code,
          expires_in: (response as any).expires_in
        }
      }
    }

    return response
  }

  async checkPairingStatus(pairingId: string): Promise<ApiResponse<{ status: 'pending' | 'authorized'; token?: string; user?: any }>> {
    const response = await this.request({
      method: 'GET',
      url: `/pairing/check/${pairingId}`
    })

    if (response.success && !response.data && (response as any).status) {
      return {
        success: true,
        data: {
          status: (response as any).status,
          token: (response as any).token,
          user: (response as any).user
        }
      }
    }

    return response
  }

  async authorizePairing(pairingId: string, deviceName: string): Promise<ApiResponse<{ message: string }>> {
    return this.request({
      method: 'POST',
      url: '/pairing/authorize',
      data: { pairing_id: pairingId, device_name: deviceName },
    })
  }
}

export const apiClient = ApiClient.getInstance()