import { useAuthStore } from '../store/authStore'
import { User } from '../types/user'

type WebSocketMessage = {
  type: string
  [key: string]: any
}

type WebSocketEventHandler = (data: any) => void

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map()
  private pairingCode: string = ''

  async connectForPairing(code: string): Promise<void> {
    this.pairingCode = code
    return this.connect(`wss://api.scribeflow.com/ws/pairing?code=${code}`)
  }

  async connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.reconnectAttempts = 0
          this.send({ type: 'authenticate', code: this.pairingCode })
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(data)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason)
          this.ws = null
          this.attemptReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    setTimeout(() => {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      if (this.pairingCode) {
        this.connectForPairing(this.pairingCode).catch(() => {
          this.attemptReconnect()
        })
      }
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts))
  }

  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.error('WebSocket is not connected')
    }
  }

  on(event: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  off(event: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private handleMessage(data: WebSocketMessage): void {
    console.log('WebSocket message received:', data.type)

    switch (data.type) {
      case 'paired':
        this.handlePairingSuccess(data.token)
        break
      case 'qr_generated':
        this.emit('qr_generated', data.qrUrl)
        break
      case 'error':
        this.emit('error', data.message)
        break
      default:
        this.emit(data.type, data)
    }
  }

  private handlePairingSuccess(token: string): void {
    const userData: User = {
      id: 'temp-id',
      email: 'user@example.com',
      name: 'Paired User',
      role: 'doctor',
      department: 'General'
    }

    useAuthStore.getState().login(userData, token)
    
    this.emit('paired', { token })
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.eventHandlers.clear()
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const webSocketService = new WebSocketService()