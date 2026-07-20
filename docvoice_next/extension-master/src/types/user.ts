export interface User {
  id: number | string
  email: string
  name: string
  role: string
  department: string
  companyId?: number | string
  profileImage?: string
  phone?: string
  status?: string
  company?: {
    id: number
    name: string
    domain?: string
    plan_type?: string
    status?: string
  }
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

// ── Speech Model Selection Types ──
export type SpeechModelType = 'WHISPER' | 'ORACLE_MEDICAL'

export interface SpeechModelConfig {
  modelType: 'WHISPER' | 'ORACLE'
  modelDomain: 'GENERIC' | 'MEDICAL'
  languageCode: string
  label: string
  description: string
  icon: string
}