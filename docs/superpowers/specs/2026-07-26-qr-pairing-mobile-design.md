# QR Pairing from Mobile PWA — Design Spec

**Date:** 2026-07-26
**Goal:** Let a doctor on the SoutNote mobile PWA scan a QR code shown by the Chrome extension's login screen to authenticate the extension, WhatsApp-Web style. No credentials retyped on the extension side.

**Scope:** Mobile PWA additions only. Extension-side QR display, backend endpoints, and polling are already implemented and unchanged.

---

## 1. Context — What Already Exists

- **Backend** (`docvoice_api-master/app/Http/Controllers/PairingController.php`):
  - `POST /api/pairing/initiate` (public) — generates UUID + 6-digit short_code, stores under `pairing:UUID` with 10-min TTL, returns `{ pairing_id, short_code, expires_in }`.
  - `GET /api/pairing/check/{id}` (public) — polling endpoint. Returns `{ status: 'pending' }` or `{ status: 'authorized', token, user }`.
  - `POST /api/pairing/authorize` (auth:sanctum) — takes `{ pairing_id, device_name }` from an already-logged-in device, generates a fresh Sanctum token for that pairing, updates cache to `authorized`. Accepts either the UUID or the 6-digit code.
- **Extension** (`docvoice_next/extension-master/src/popup/screens/LoginScreen.tsx`):
  - Calls `initiatePairing()`, renders QR with payload `pairing:<UUID>`, polls `checkPairingStatus(UUID)` every 3s, on `authorized` logs in via `authService.loginWithToken(token, user)`.
- **apiClient** already has `initiatePairing()` and `checkPairingStatus(id)`.

**Only the mobile-side scanner + authorize call are missing.**

---

## 2. Files

**New:**
- `docvoice_next/extension-master/src/pwa/components/QrScannerModal.tsx` — full-screen scanner (camera + jsQR + manual-code fallback + error states).
- `docvoice_next/extension-master/src/pwa/pairing/parsePairingPayload.ts` — pure function extracting the UUID from a scanned string.
- `docvoice_next/extension-master/src/pwa/pairing/parsePairingPayload.test.ts` — unit tests.

**Modified:**
- `docvoice_next/extension-master/src/services/apiClient.ts` — add `authorizePairing(pairingId, deviceName)`.
- `docvoice_next/extension-master/src/popup/components/ProfileMenu.tsx` — add "Link Chrome extension" section, gated on `!platform.isExtension`, opens `QrScannerModal`.
- `docvoice_next/extension-master/package.json` — add `jsqr` dependency.

---

## 3. Data Flow

```
[Extension]                        [Backend]                       [PWA (mobile, logged in)]
   opens LoginScreen                                                    │
       │ POST /pairing/initiate                                         │
       ├──────────────────────────►│                                    │
       │ {pairing_id, short_code}  │                                    │
       │◄──────────────────────────┤                                    │
       │                                                                │
   renders QR with "pairing:<UUID>"                                     │
       │                                                                │
   polls every 3s:                                                      │
   GET /pairing/check/<UUID> → {status:'pending'}                       │
       │                                                       user opens Settings
       │                                                       taps "Link Chrome extension"
       │                                                                │
       │                                                       camera opens
       │                                                       jsQR reads "pairing:<UUID>"
       │                                                                │
       │                POST /pairing/authorize (Bearer <mobile-token>) │
       │                {pairing_id: <UUID>, device_name: "..."}        │
       │                          │◄────────────────────────────────────┤
       │                          │ mints new Sanctum token             │
       │                          │ stores {status:'authorized', token, user}
       │                          │ under 'pairing:<UUID>' for 5 min    │
       │                          ├────────────────────────────────────►│
       │                          │ {success:true}                      │
       │                                                                │
   next poll:                                                    modal closes with success
   GET /pairing/check/<UUID> → {status:'authorized', token, user}       │
       │                                                                │
   authService.loginWithToken(token, user)                              │
   navigates to HOME                                                    │
```

---

## 4. Component Details

### `parsePairingPayload(raw: string): string | null`

Pure function. Accepts the QR string, returns UUID or `null`:

```ts
export function parsePairingPayload(raw: string): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  const PREFIX = 'pairing:'
  if (!trimmed.toLowerCase().startsWith(PREFIX)) return null
  const value = trimmed.slice(PREFIX.length).trim()
  // Accept UUID (36 chars with dashes) OR 6-digit code
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const code = /^\d{6}$/
  if (uuid.test(value) || code.test(value)) return value
  return null
}
```

### `apiClient.authorizePairing(pairingId: string, deviceName: string)`

```ts
async authorizePairing(pairingId: string, deviceName: string): Promise<ApiResponse<{ message: string }>> {
  return this.request({
    method: 'POST',
    url: '/pairing/authorize',
    data: { pairing_id: pairingId, device_name: deviceName },
  })
}
```

The existing request interceptor attaches the Bearer token automatically.

### `QrScannerModal`

Props: `{ open: boolean; onClose: () => void; onSuccess?: () => void }`.

Behavior:
1. On open: request `navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })`.
2. Assign stream to `<video autoplay playsInline muted>` element.
3. Start a `requestAnimationFrame` loop:
   - Draw current video frame into a hidden `<canvas>` at the video's intrinsic size.
   - `ctx.getImageData(0, 0, w, h)` → `jsQR(data.data, w, h, { inversionAttempts: 'dontInvert' })`.
   - If `code.data` present, call `parsePairingPayload(code.data)`.
   - If parses → stop loop, stop tracks, call `apiClient.authorizePairing(uuid, "SoutNote Mobile Web")`.
   - On 200: haptic tick (`navigator.vibrate?.(30)`), success state ("تم ربط الإضافة بنجاح"), auto-close after 1.5s, call `onSuccess`.
   - On 404: error state "الرمز منتهي — حدّث الشاشة على الإضافة"، زر "أعِد المحاولة" (يعيد بدء المسح).
4. Manual entry: "أدخل الكود يدوياً" button toggles a 6-digit input (with numeric keyboard) + submit button using the same `authorizePairing` endpoint.
5. Errors:
   - `NotAllowedError` (permission denied) → screen with "لتفعيل الكاميرا: افتح إعدادات الموقع → أذونات → الكاميرا → السماح"، plus manual entry always available.
   - `NotFoundError` / no camera → "لا توجد كاميرا متاحة"، manual entry only.
   - Non-pairing QR → toast "هذا ليس رمز SoutNote" (2s)، keep scanning.

Cleanup on unmount / close: cancel RAF, `stream.getTracks().forEach(t => t.stop())`.

UI:
- Full-screen `fixed inset-0 z-[200] bg-black`.
- Video fills screen with `object-cover`.
- Overlay: dark 40% except a 260×260 transparent square in the center with 4 cyan corner brackets.
- Header: back arrow (top-right for LTR? — set `dir="ltr"` on modal; back button top-left is clearer for a scan modal), title "امسح رمز الربط".
- Bottom: hint "افتح إضافة الكروم لتظهر شاشة رمز الربط" + "أدخل الكود يدوياً" text button.

### `ProfileMenu` addition

Between "Custom Topics" and "Logout" sections, add a new section rendered ONLY when `!platform.isExtension`:

```tsx
{!platform.isExtension && (
  <>
    <div className="border-t border-gray-100 dark:border-slateDark-divider"></div>
    <div className="px-4 py-3">
      <div className="flex items-center space-x-2 mb-2">
        <svg className="w-4 h-4 text-gray-400" ...QR icon /></svg>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Link Chrome Extension
        </span>
      </div>
      <button
        onClick={() => { setIsOpen(false); setShowScanner(true) }}
        className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium text-sm"
      >
        امسح رمز الربط
      </button>
    </div>
  </>
)}
{showScanner && (
  <QrScannerModal open onClose={() => setShowScanner(false)} />
)}
```

---

## 5. Security

- **Mobile must be authenticated.** `/pairing/authorize` requires `auth:sanctum`. No unauthenticated device can authorize an extension.
- **Session TTL: 10 minutes** for the pending pairing, 5 minutes for the authorized token in cache (existing backend config, unchanged).
- **Fresh Sanctum token per pair.** The extension never receives the mobile's own token — a new Sanctum token is minted for the extension with `device_name = "SoutNote Chrome Extension"`. Doctor can revoke it later per-device.
- **Camera frames stay on-device.** Frames are processed synchronously in memory; nothing leaves the browser except the parsed UUID.
- **HTTPS required.** `getUserMedia` refuses on non-secure origins (except `localhost` for dev).
- **QR content is opaque** — the pairing UUID alone grants no authority; only an authenticated `POST /pairing/authorize` mints a token.

---

## 6. Testing

**Unit (vitest + jsdom):**
- `parsePairingPayload` — accepts valid `pairing:<UUID>`, valid `pairing:123456`, case-insensitive prefix, rejects null/empty/wrong-prefix/malformed UUID/non-numeric code.
- `apiClient.authorizePairing` — mock axios, verify URL, body `{pairing_id, device_name}`, and Bearer token attached.

**Manual (needs camera hardware):**
- Happy path: mobile scans extension QR → extension logs in within 3s.
- Manual fallback: mobile types 6-digit code → same result.
- Camera denied: shows guidance + manual fallback still works.
- Expired QR: user waits 11 min, tries to authorize → 404 → clear message + retry.
- Non-pairing QR (any random QR): toast shown, scanning continues.

---

## 7. Out of Scope

- Backend changes — the endpoints already do exactly what we need.
- Extension-side changes — LoginScreen already renders the QR and polls.
- Revoking/managing paired devices UI — future work.
- Support for scanning from the Chrome extension side — reverse direction not requested.
