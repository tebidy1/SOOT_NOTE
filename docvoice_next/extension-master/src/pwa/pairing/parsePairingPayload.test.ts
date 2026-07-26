import { describe, it, expect } from 'vitest'
import { parsePairingPayload } from './parsePairingPayload'

describe('parsePairingPayload', () => {
  it('extracts UUID from valid "pairing:<UUID>" payload', () => {
    const uuid = '12345678-1234-1234-1234-123456789abc'
    expect(parsePairingPayload(`pairing:${uuid}`)).toBe(uuid)
  })

  it('extracts 6-digit code from valid "pairing:<code>" payload', () => {
    expect(parsePairingPayload('pairing:123456')).toBe('123456')
  })

  it('accepts case-insensitive prefix', () => {
    const uuid = 'abcdef01-2345-6789-abcd-ef0123456789'
    expect(parsePairingPayload(`PAIRING:${uuid}`)).toBe(uuid)
    expect(parsePairingPayload(`Pairing:${uuid}`)).toBe(uuid)
  })

  it('trims surrounding whitespace', () => {
    const uuid = '12345678-1234-1234-1234-123456789abc'
    expect(parsePairingPayload(`  pairing:${uuid}  `)).toBe(uuid)
  })

  it('returns null for missing prefix', () => {
    expect(parsePairingPayload('12345678-1234-1234-1234-123456789abc')).toBeNull()
    expect(parsePairingPayload('https://example.com')).toBeNull()
  })

  it('returns null for malformed UUID after prefix', () => {
    expect(parsePairingPayload('pairing:not-a-uuid')).toBeNull()
    expect(parsePairingPayload('pairing:12345')).toBeNull() // 5-digit, not 6
    expect(parsePairingPayload('pairing:1234567')).toBeNull() // 7-digit
  })

  it('returns null for empty payload after prefix', () => {
    expect(parsePairingPayload('pairing:')).toBeNull()
    expect(parsePairingPayload('pairing:   ')).toBeNull()
  })

  it('returns null for non-string input', () => {
    expect(parsePairingPayload(null)).toBeNull()
    expect(parsePairingPayload(undefined)).toBeNull()
    expect(parsePairingPayload(123456)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parsePairingPayload('')).toBeNull()
  })
})
