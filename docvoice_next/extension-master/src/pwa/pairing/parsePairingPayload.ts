// Payload format emitted by the extension's LoginScreen QR: "pairing:<UUID>".
// The backend also accepts a 6-digit code, so this parser recognizes both.
const PREFIX = 'pairing:'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CODE_RE = /^\d{6}$/

export function parsePairingPayload(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (trimmed.length < PREFIX.length) return null
  if (trimmed.slice(0, PREFIX.length).toLowerCase() !== PREFIX) return null
  const value = trimmed.slice(PREFIX.length).trim()
  if (!value) return null
  if (UUID_RE.test(value) || CODE_RE.test(value)) return value
  return null
}
