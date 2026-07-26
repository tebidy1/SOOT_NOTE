# QR Pairing (Mobile PWA → Chrome Extension) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Link Chrome extension" button in the mobile PWA settings that opens a camera-based QR scanner. Scanning the QR shown by the extension's login screen authorizes the extension via the existing `/pairing/authorize` endpoint — WhatsApp-Web style.

**Architecture:** Backend endpoints, extension-side QR display, and polling are already in place (`PairingController.php`, `LoginScreen.tsx`). This plan only adds the mobile-side scanner (jsQR + camera stream), the `authorizePairing` apiClient method, and the settings entry.

**Tech Stack:** React 18, TypeScript, Tailwind, `jsqr` (~43KB WASM-free), `navigator.mediaDevices.getUserMedia`, vitest.

**Related docs:**
- [Design spec](../specs/2026-07-26-qr-pairing-mobile-design.md)
- [PairingController.php](../../../docvoice_api-master/app/Http/Controllers/PairingController.php)
- [LoginScreen.tsx](../../../docvoice_next/extension-master/src/popup/screens/LoginScreen.tsx)

---

### Task 0: Install jsqr

**Files:**
- Modify: `docvoice_next/extension-master/package.json`

- [ ] **Step 1: Install jsqr**

Run from `docvoice_next/extension-master/`:
```bash
npm install jsqr@1.4.0
```
Expected: `package.json` now has `"jsqr": "^1.4.0"` in `dependencies`, `node_modules/jsqr/` exists.

- [ ] **Step 2: Verify types resolve**

Create a throwaway test file:
```bash
node -e "const jsQR = require('jsqr'); console.log(typeof jsQR)"
```
Expected: `function`

- [ ] **Step 3: Commit**

```bash
git add docvoice_next/extension-master/package.json docvoice_next/extension-master/package-lock.json
git commit -m "deps: add jsqr for QR code scanning in PWA"
```

---

### Task 1: parsePairingPayload — pure parser (TDD)

**Files:**
- Create: `docvoice_next/extension-master/src/pwa/pairing/parsePairingPayload.ts`
- Test: `docvoice_next/extension-master/src/pwa/pairing/parsePairingPayload.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/pwa/pairing/parsePairingPayload.test.ts`:

```ts
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
    // @ts-expect-error – testing runtime safety
    expect(parsePairingPayload(null)).toBeNull()
    // @ts-expect-error
    expect(parsePairingPayload(undefined)).toBeNull()
    // @ts-expect-error
    expect(parsePairingPayload(123456)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parsePairingPayload('')).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

From `docvoice_next/extension-master/`:
```bash
npx vitest run src/pwa/pairing/parsePairingPayload.test.ts
```
Expected: All fail — module not found.

- [ ] **Step 3: Implement parsePairingPayload**

Create `src/pwa/pairing/parsePairingPayload.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/pwa/pairing/parsePairingPayload.test.ts
```
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add docvoice_next/extension-master/src/pwa/pairing/parsePairingPayload.ts docvoice_next/extension-master/src/pwa/pairing/parsePairingPayload.test.ts
git commit -m "feat(pwa): add parsePairingPayload for QR content"
```

---

### Task 2: apiClient.authorizePairing (TDD)

**Files:**
- Modify: `docvoice_next/extension-master/src/services/apiClient.ts`
- Test: `docvoice_next/extension-master/src/services/apiClient.test.ts` (create if missing)

- [ ] **Step 1: Check if apiClient.test.ts exists**

```bash
ls docvoice_next/extension-master/src/services/apiClient.test.ts
```

If missing, create it with imports:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from './apiClient'
import { useAuthStore } from '../store/authStore'
```

- [ ] **Step 2: Write the failing test**

Add to `src/services/apiClient.test.ts`:

```ts
describe('apiClient.authorizePairing', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'test-mobile-token', user: null, isAuthenticated: true, isLoading: false, error: null })
  })

  it('POSTs pairing_id and device_name to /pairing/authorize with Bearer token', async () => {
    const spy = vi.spyOn((apiClient as any).client, 'request').mockResolvedValue({
      data: { success: true, message: 'Device authorized' }
    })
    const uuid = '12345678-1234-1234-1234-123456789abc'
    const res = await apiClient.authorizePairing(uuid, 'SoutNote Mobile Web')

    expect(spy).toHaveBeenCalledTimes(1)
    const call = spy.mock.calls[0][0]
    expect(call.method).toBe('POST')
    expect(call.url).toBe('/pairing/authorize')
    expect(call.data).toEqual({ pairing_id: uuid, device_name: 'SoutNote Mobile Web' })
    expect(res.success).toBe(true)
  })

  it('returns error payload on non-200 response', async () => {
    vi.spyOn((apiClient as any).client, 'request').mockRejectedValue({
      response: { data: { success: false, message: 'Session expired' } }
    })
    const res = await apiClient.authorizePairing('bad-uuid', 'X')
    expect(res.success).toBe(false)
    expect((res as any).message ?? (res as any).error).toBeDefined()
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run src/services/apiClient.test.ts
```
Expected: FAIL — `apiClient.authorizePairing` is not a function.

- [ ] **Step 4: Add method to apiClient**

Edit `src/services/apiClient.ts`. Locate the method `getOracleToken` and add BELOW it (before the closing `}` of the `ApiClient` class):

```ts
async authorizePairing(pairingId: string, deviceName: string): Promise<ApiResponse<{ message: string }>> {
  return this.request({
    method: 'POST',
    url: '/pairing/authorize',
    data: { pairing_id: pairingId, device_name: deviceName },
  })
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/services/apiClient.test.ts
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add docvoice_next/extension-master/src/services/apiClient.ts docvoice_next/extension-master/src/services/apiClient.test.ts
git commit -m "feat(api): add authorizePairing to apiClient"
```

---

### Task 3: QrScannerModal component

**Files:**
- Create: `docvoice_next/extension-master/src/pwa/components/QrScannerModal.tsx`

This component is heavy on browser APIs (`getUserMedia`, `requestAnimationFrame`, `canvas`) that are hard to unit-test meaningfully — real verification is manual with a camera. We ship it, then verify visually.

- [ ] **Step 1: Create the file with full implementation**

Create `src/pwa/components/QrScannerModal.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { apiClient } from '../../services/apiClient'
import { parsePairingPayload } from '../pairing/parsePairingPayload'

type Phase = 'requesting' | 'scanning' | 'authorizing' | 'success' | 'error'

interface QrScannerModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const DEVICE_NAME = 'SoutNote Mobile Web'

export default function QrScannerModal({ open, onClose, onSuccess }: QrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const authorizingRef = useRef(false)  // prevent double-POST if two frames match

  const [phase, setPhase] = useState<Phase>('requesting')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [toast, setToast] = useState<string | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [manualSubmitting, setManualSubmitting] = useState(false)

  const stopStream = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  const handleClose = () => {
    stopStream()
    onClose()
  }

  const showToast = (text: string, ms = 1800) => {
    setToast(text)
    setTimeout(() => setToast(null), ms)
  }

  const authorize = async (id: string) => {
    if (authorizingRef.current) return
    authorizingRef.current = true
    setPhase('authorizing')
    try {
      const res = await apiClient.authorizePairing(id, DEVICE_NAME)
      if (res.success) {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(30)
        setPhase('success')
        setTimeout(() => {
          stopStream()
          onSuccess?.()
          onClose()
        }, 1500)
      } else {
        setErrorMsg((res as any).message || (res as any).error || 'تعذّر ربط الإضافة. حاول مجدداً.')
        setPhase('error')
        authorizingRef.current = false
      }
    } catch (e: any) {
      setErrorMsg('خطأ في الاتصال بالخادم. تأكد من الاتصال ثم أعِد المحاولة.')
      setPhase('error')
      authorizingRef.current = false
    }
  }

  const startCamera = async () => {
    setPhase('requesting')
    setErrorMsg('')
    authorizingRef.current = false
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setPhase('scanning')
      scanLoop()
    } catch (e: any) {
      const name = e?.name || ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setErrorMsg('إذن الكاميرا مرفوض. لتفعيله: افتح إعدادات المتصفح لهذا الموقع → الأذونات → الكاميرا → السماح.')
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setErrorMsg('لا توجد كاميرا متاحة على هذا الجهاز. استخدم الإدخال اليدوي بدلاً منها.')
      } else {
        setErrorMsg('تعذّر فتح الكاميرا: ' + (e?.message || 'خطأ غير معروف'))
      }
      setPhase('error')
    }
  }

  const scanLoop = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanLoop)
      return
    }
    const w = video.videoWidth
    const h = video.videoHeight
    if (!w || !h) {
      rafRef.current = requestAnimationFrame(scanLoop)
      return
    }
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    ctx.drawImage(video, 0, 0, w, h)
    const imgData = ctx.getImageData(0, 0, w, h)
    const code = jsQR(imgData.data, w, h, { inversionAttempts: 'dontInvert' })
    if (code && code.data) {
      const parsed = parsePairingPayload(code.data)
      if (parsed) {
        authorize(parsed)
        return  // stop RAF; authorize() controls what happens next
      } else {
        showToast('هذا ليس رمز SoutNote')
      }
    }
    rafRef.current = requestAnimationFrame(scanLoop)
  }

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = manualCode.trim()
    if (!/^\d{6}$/.test(code)) {
      setToast('أدخل 6 أرقام بالضبط')
      return
    }
    setManualSubmitting(true)
    await authorize(code)
    setManualSubmitting(false)
  }

  useEffect(() => {
    if (open) startCamera()
    return stopStream
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[200] bg-black text-white flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-sm">
        <h2 className="text-base font-bold">امسح رمز الربط</h2>
        <button
          onClick={handleClose}
          aria-label="إغلاق"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Video / scan viewport */}
      <div className="flex-1 relative overflow-hidden">
        {(phase === 'scanning' || phase === 'authorizing' || phase === 'success' || phase === 'requesting') && (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Dim overlay with clear square */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-black/40" />
              {/* Clear square 260x260 centered */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] rounded-2xl" />
              {/* Cyan corner brackets */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px]">
                <span className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-[3px] border-l-[3px] border-cyan-400 rounded-tl-2xl" />
                <span className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-[3px] border-r-[3px] border-cyan-400 rounded-tr-2xl" />
                <span className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-[3px] border-l-[3px] border-cyan-400 rounded-bl-2xl" />
                <span className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-[3px] border-r-[3px] border-cyan-400 rounded-br-2xl" />
              </div>
            </div>

            {phase === 'authorizing' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-cyan-400 border-t-transparent mx-auto" />
                  <p className="mt-3 text-sm">جارٍ ربط الإضافة...</p>
                </div>
              </div>
            )}

            {phase === 'success' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="mt-3 text-base font-bold">تم ربط الإضافة بنجاح</p>
                </div>
              </div>
            )}

            {phase === 'requesting' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-cyan-400 border-t-transparent mx-auto" />
                  <p className="mt-3 text-sm">جارٍ فتح الكاميرا...</p>
                </div>
              </div>
            )}
          </>
        )}

        {phase === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center p-6 bg-black">
            <div className="max-w-sm text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-3">
                <svg className="w-9 h-9 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <p className="text-sm leading-relaxed text-slate-200 mb-4">{errorMsg}</p>
              <button
                onClick={startCamera}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-sm font-bold"
              >
                أعِد المحاولة
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer with hint + manual entry */}
      <div className="relative z-10 px-4 py-4 bg-black/70 backdrop-blur-sm">
        {!manualOpen ? (
          <>
            <p className="text-center text-xs text-slate-300 mb-3 leading-relaxed">
              افتح إضافة الكروم لتظهر شاشة رمز الربط، ثم صوّب الكاميرا على الرمز.
            </p>
            <button
              onClick={() => setManualOpen(true)}
              className="w-full py-2.5 border border-white/20 rounded-xl text-sm font-medium hover:bg-white/10"
            >
              أدخل الكود يدوياً
            </button>
          </>
        ) : (
          <form onSubmit={submitManual} className="space-y-2">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              dir="ltr"
              className="w-full py-3 px-4 rounded-xl bg-white text-black text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-400"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setManualOpen(false); setManualCode('') }}
                className="flex-1 py-2.5 border border-white/20 rounded-xl text-sm"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={manualSubmitting || manualCode.length !== 6}
                className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 rounded-xl text-sm font-bold"
              >
                {manualSubmitting ? '...' : 'ربط'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 top-20 z-[210] px-4 py-2 bg-black/80 text-white text-sm rounded-full backdrop-blur-sm">
          {toast}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check the file**

From `docvoice_next/extension-master/`:
```bash
npx tsc --noEmit
```
Expected: no errors related to `QrScannerModal.tsx`.

- [ ] **Step 3: Commit**

```bash
git add docvoice_next/extension-master/src/pwa/components/QrScannerModal.tsx
git commit -m "feat(pwa): add QrScannerModal (camera + jsQR + manual fallback)"
```

---

### Task 4: Wire QrScannerModal into ProfileMenu

**Files:**
- Modify: `docvoice_next/extension-master/src/popup/components/ProfileMenu.tsx`

- [ ] **Step 1: Add imports at top of ProfileMenu.tsx**

Locate the imports block (starting `import { useState, useRef, useEffect } from 'react'`) and add:

```ts
import { platform } from '../../platform'
import QrScannerModal from '../../pwa/components/QrScannerModal'
```

- [ ] **Step 2: Add scanner state near the top of the component**

Locate the block:
```ts
const [isOpen, setIsOpen] = useState(false)
const [showConfirmDialog, setShowConfirmDialog] = useState(false)
const [pendingModel, setPendingModel] = useState<SpeechModelType | null>(null)
```

Add BELOW it:
```ts
const [showScanner, setShowScanner] = useState(false)
```

- [ ] **Step 3: Insert the "Link Chrome Extension" section**

Find the "Custom Topics" section (search for `Recording Topics`). Immediately AFTER its closing `</div>` and BEFORE the `{/* Divider */}` line preceding the Logout section, insert:

```tsx
{/* PWA-only: pair a Chrome extension via QR */}
{!platform.isExtension && (
  <>
    <div className="border-t border-gray-100 dark:border-slateDark-divider"></div>
    <div className="px-4 py-3">
      <div className="flex items-center space-x-2 mb-2">
        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          Link Chrome Extension
        </span>
      </div>
      <button
        onClick={() => { setIsOpen(false); setShowScanner(true) }}
        className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium text-sm hover:from-cyan-600 hover:to-blue-700 transition-colors shadow-sm"
        id="scan-qr-button"
      >
        امسح رمز الربط
      </button>
    </div>
  </>
)}
```

- [ ] **Step 4: Mount QrScannerModal outside the dropdown**

Find the closing `</>` of the component's outer fragment (right before the final `)`). Immediately BEFORE it, insert:

```tsx
{showScanner && (
  <QrScannerModal
    open
    onClose={() => setShowScanner(false)}
    onSuccess={() => { /* keep quiet; toast is inside the modal */ }}
  />
)}
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 6: Run all tests to confirm nothing regressed**

```bash
npm test -- --run
```
Expected: all previously passing tests still pass; new tests from Tasks 1–2 pass.

- [ ] **Step 7: Commit**

```bash
git add docvoice_next/extension-master/src/popup/components/ProfileMenu.tsx
git commit -m "feat(pwa): add 'Link Chrome extension' button in settings menu"
```

---

### Task 5: End-to-end manual verification

**Files:** none modified — this task is verification only.

- [ ] **Step 1: Start the Laravel backend**

From `D:\docvoice_api-master`:
```bash
php artisan serve --port=8002
```
Expected: `Server running on http://127.0.0.1:8002`.

- [ ] **Step 2: Build and serve the extension**

From `docvoice_next/extension-master/`:
```bash
npm run build
```
Then load `dist/` as an unpacked extension in Chrome (`chrome://extensions` → Developer mode → Load unpacked).

- [ ] **Step 3: Start the PWA dev server**

From `docvoice_next/extension-master/`:
```bash
npm run dev:pwa
```
Open `http://localhost:5174` on a phone in the same network (or use `--host` to expose). Log in on the phone with valid credentials.

- [ ] **Step 4: Trigger the pairing flow**

On the extension: open the popup (logged out). It should show the QR.
On the phone PWA: tap gear → "Link Chrome Extension" → "امسح رمز الربط".

- [ ] **Step 5: Verify the happy path**

Point phone camera at the extension QR. Expected sequence:
1. Camera opens, QR detected within 1–2 seconds.
2. Modal shows "جارٍ ربط الإضافة..." spinner.
3. Modal shows green check + "تم ربط الإضافة بنجاح", closes after 1.5s.
4. Extension polling picks up authorized status within 3s and navigates to HOME.

- [ ] **Step 6: Verify manual fallback**

Reopen the extension (log out first if needed) to get a new QR + 6-digit code. On phone: tap "Link Chrome Extension" → "أدخل الكود يدوياً" → type the 6-digit code → tap "ربط". Same result as Step 5.

- [ ] **Step 7: Verify camera-denied path**

In phone browser, deny camera permission for the PWA origin. Retry the flow. Expected: error screen with clear guidance + manual entry still works.

- [ ] **Step 8: Verify expired-code path**

Wait 11+ minutes without pairing. Try to authorize. Expected: 404 → error screen "تعذّر ربط الإضافة" (or backend message) → "أعِد المحاولة" button.

- [ ] **Step 9: Verify no regression on the extension side**

With extension unloaded and reloaded, confirm normal email/password login still works. Confirm the LoginScreen still renders the QR unchanged.

- [ ] **Step 10: Finalize**

If everything above passes, invoke the finishing-a-development-branch skill to complete this work.

---

## Notes for the implementing agent

- **Never modify `PairingController.php` or any backend file.** Backend is complete.
- **Never modify `LoginScreen.tsx`.** Extension-side QR display and polling are already correct.
- **Sync policy:** The user's memory says the live server runs from root `docvoice_api-master`, not the git-tracked copy. This plan doesn't touch backend files, so no sync is needed. But if any accidental backend edit happens, it must be applied to BOTH paths.
- **Never introduce third-party providers.** All auth stays on Oracle-hosted Laravel per the Oracle-only data sovereignty policy in memory.
- **jsqr does image decoding synchronously in JS.** No workers, no WASM, no external requests — it stays within the browser sandbox and the offline-first PWA constraint.
