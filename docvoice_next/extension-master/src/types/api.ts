export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  code: number
  message: string
  details?: any
}

export interface LoginResponse {
  user: {
    id: number | string
    email: string
    name: string
    role: string
    department?: string
    company_id?: number
    medical_department_id?: number | null
    profile_image_url?: string
    avatar?: string
    phone?: string
    status?: string
    company?: any
    [key: string]: any
  }
  token: string
  expiresIn?: number
}

export interface OracleTranscriptionResponse {
  job_id: string
  status: string
}

export interface TranscriptionStatusResponse {
  job_status: string
  transcript?: string
  confidence?: number
}

export interface InboxResponse {
  notes: any[]
  total: number
  page: number
  limit: number
}