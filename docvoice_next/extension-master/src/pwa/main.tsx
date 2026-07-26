import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from '../popup/App'
import '../styles/globals.css'
import '../popup/index.css'
import { apiClient } from '../services/apiClient'
import { flushQueue } from './offline/flushQueue'
import { listQueue, QueueItem } from './offline/audioQueue'

registerSW({ immediate: true })

// Enforce LTR direction: medical content is in English; the HTML template
// starts with dir="ltr" but Vite dev-server may not hot-reload HTML changes,
// so we also set it programmatically at runtime.
document.documentElement.setAttribute('dir', 'ltr')

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
