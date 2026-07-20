export interface ChromeStorage {
  authToken?: string
  user?: any
  settings?: {
    language: string
    autoInject: boolean
    notificationEnabled: boolean
  }
  lastInjection?: {
    url: string
    timestamp: string
    fields: any[]
  }
}

export interface Message {
  type: string
  payload?: any
  error?: string
}

export interface TabInfo {
  id: number
  url: string
  title: string
  favIconUrl?: string
}