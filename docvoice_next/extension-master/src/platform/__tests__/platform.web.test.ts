import { describe, it, expect } from 'vitest'
import { webPlatform } from '../platform.web'

describe('webPlatform', () => {
  it('is not an extension', () => {
    expect(webPlatform.isExtension).toBe(false)
  })

  it('sets and gets multiple keys', async () => {
    await webPlatform.storage.set({ authToken: 't1', user: { id: 9 } })
    const r = await webPlatform.storage.get(['authToken', 'user'])
    expect(r.authToken).toBe('t1')
    expect(r.user).toEqual({ id: 9 })
  })

  it('removes keys', async () => {
    await webPlatform.storage.set({ gone: 1 })
    await webPlatform.storage.remove('gone')
    const r = await webPlatform.storage.get('gone')
    expect(r.gone).toBeUndefined()
  })

  it('resolves asset urls to a static path', () => {
    expect(webPlatform.assetUrl('pcm-worklet.js')).toBe('/pcm-worklet.js')
  })
})
