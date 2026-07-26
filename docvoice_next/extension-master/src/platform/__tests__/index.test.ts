import { describe, it, expect } from 'vitest'
import { detectPlatform } from '../index'
import { webPlatform } from '../platform.web'

describe('detectPlatform', () => {
  it('returns web platform when chrome global is undefined', () => {
    expect(detectPlatform(undefined)).toBe(webPlatform)
  })

  it('returns web platform when chrome exists but storage does not', () => {
    expect(detectPlatform({} as any)).toBe(webPlatform)
  })

  it('returns extension platform when chrome.storage.local exists', () => {
    const fakeChrome = { storage: { local: {} } } as any
    expect(detectPlatform(fakeChrome).isExtension).toBe(true)
  })
})
