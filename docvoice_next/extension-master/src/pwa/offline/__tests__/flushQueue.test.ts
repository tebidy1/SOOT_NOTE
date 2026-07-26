import { describe, it, expect, vi, beforeEach } from 'vitest'
import { enqueue, listQueue } from '../audioQueue'
import { flushQueue } from '../flushQueue'
import { idbSet } from '../../../platform/idbKeyval'

const blob = () => new Blob([new Uint8Array([1])], { type: 'audio/webm' })

// Reset the queue between tests so items from one test don't leak into another.
beforeEach(async () => { await idbSet('audioQueue', []) })

describe('flushQueue', () => {
  it('uploads queued items and removes them on success', async () => {
    await enqueue({ blob: blob(), templateId: 't1', specialty: 'x' })
    const uploader = vi.fn().mockResolvedValue({ ok: true })
    await flushQueue(uploader)
    expect(uploader).toHaveBeenCalledTimes(1)
    const remaining = await listQueue()
    expect(remaining.length).toBe(0)
  })

  it('marks items failed when upload throws, keeping them queued', async () => {
    await enqueue({ blob: blob(), templateId: null, specialty: '' })
    const uploader = vi.fn().mockRejectedValue(new Error('network'))
    await flushQueue(uploader)
    const failed = (await listQueue()).find(i => i.status === 'failed')
    expect(failed).toBeTruthy()
    expect(failed?.error).toBe('network')
  })
})
