import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from '../popup/App'
import '../popup/index.css'
import { apiClient } from '../services/apiClient'
import { flushQueue } from './offline/flushQueue'
import { listQueue, QueueItem } from './offline/audioQueue'

registerSW({ immediate: true })

// Upload one queued item: async transcription via /audio/transcribe-oracle.
// The resulting note reaches the inbox on its own (server-side pipeline).
const uploader = (item: QueueItem) => apiClient.transcribeOracle(item.blob)

window.addEventListener('online', () => { flushQueue(uploader) })
// Startup sweep — in case the app opens with pending items already queued.
listQueue().then(items => { if (items.length) flushQueue(uploader) })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
