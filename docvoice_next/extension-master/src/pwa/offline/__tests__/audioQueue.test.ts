import { describe, it, expect } from 'vitest'
import { enqueue, listQueue, markStatus, dequeue } from '../audioQueue'

const blob = () => new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/webm' })

describe('audioQueue', () => {
  it('enqueues and lists an item with status "queued"', async () => {
    const id = await enqueue({ blob: blob(), templateId: 't1', specialty: 'cardiology' })
    const items = await listQueue()
    const item = items.find(i => i.id === id)!
    expect(item).toBeTruthy()
    expect(item.status).toBe('queued')
    expect(item.specialty).toBe('cardiology')
  })

  it('updates status', async () => {
    const id = await enqueue({ blob: blob(), templateId: null, specialty: '' })
    await markStatus(id, 'uploading')
    const item = (await listQueue()).find(i => i.id === id)!
    expect(item.status).toBe('uploading')
  })

  it('dequeues an item', async () => {
    const id = await enqueue({ blob: blob(), templateId: null, specialty: '' })
    await dequeue(id)
    const item = (await listQueue()).find(i => i.id === id)
    expect(item).toBeUndefined()
  })
})
