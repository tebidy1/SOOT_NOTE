import { idbGet, idbSet } from '../../platform/idbKeyval'

export type QueueStatus = 'queued' | 'uploading' | 'done' | 'failed'

export interface QueueItem {
  id: string
  blob: Blob
  templateId: string | null
  specialty: string
  status: QueueStatus
  createdAt: number
  error?: string
}

const KEY = 'audioQueue'

async function readAll(): Promise<QueueItem[]> {
  return (await idbGet<QueueItem[]>(KEY)) || []
}
async function writeAll(items: QueueItem[]): Promise<void> {
  await idbSet(KEY, items)
}

export async function enqueue(input: {
  blob: Blob
  templateId: string | null
  specialty: string
}): Promise<string> {
  const items = await readAll()
  const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  items.push({ ...input, id, status: 'queued', createdAt: Date.now() })
  await writeAll(items)
  return id
}

export async function listQueue(): Promise<QueueItem[]> {
  return readAll()
}

export async function markStatus(id: string, status: QueueStatus, error?: string): Promise<void> {
  const items = await readAll()
  const i = items.findIndex(x => x.id === id)
  if (i >= 0) {
    items[i] = { ...items[i], status, error }
    await writeAll(items)
  }
}

export async function dequeue(id: string): Promise<void> {
  const items = await readAll()
  await writeAll(items.filter(x => x.id !== id))
}
