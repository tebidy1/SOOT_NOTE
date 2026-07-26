import { listQueue, markStatus, dequeue, QueueItem } from './audioQueue'

export type Uploader = (item: QueueItem) => Promise<unknown>

let flushing = false

export async function flushQueue(uploader: Uploader): Promise<void> {
  if (flushing) return
  flushing = true
  try {
    const items = await listQueue()
    for (const item of items) {
      if (item.status === 'uploading' || item.status === 'done') continue
      await markStatus(item.id, 'uploading')
      try {
        await uploader(item)
        await dequeue(item.id)
      } catch (e: any) {
        await markStatus(item.id, 'failed', e?.message || 'upload failed')
      }
    }
  } finally {
    flushing = false
  }
}
