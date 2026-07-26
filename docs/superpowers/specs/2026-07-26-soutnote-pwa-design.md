# SoutNote PWA — Design Spec

**Date:** 2026-07-26
**Status:** Approved
**Approach:** (C) Single shared codebase + Platform Adapter layer, second Vite build target for PWA.

## Goal

Ship a Progressive Web App built from the existing, working Chrome extension so a
doctor can capture and review medical notes on the go — with a professional,
**native-app-like** experience in responsiveness and UX on every screen and touch.

The extension keeps its unique feature (auto-injecting fields into EHR web forms);
the PWA cannot do that (sandboxed), so injection is feature-gated and replaced by
per-field copy in the PWA.

## Non-Negotiable Constraints (from project memory)

- **Oracle-only data sovereignty.** Only Oracle OCI (Speech, Generative AI).
  Groq and Gemini are PROHIBITED. No third-party fallback. No backend provider changes.
- **Served vs edited backend copy.** The live server runs from the *root*
  `docvoice_api-master`, not the git-tracked `docvoice_next/docvoice_api-master`.
  This PWA work does **not** modify the backend, so this caveat does not apply here —
  but keep it in mind if any endpoint change becomes necessary.
- No secrets or patient data in URL params/query strings.

## Current-State Findings (verified in code)

- App = React 18 + Vite 4 + Tailwind + Zustand + react-router (`HashRouter`),
  rendered today in the extension side panel from `src/popup/`.
- Audio: `getUserMedia` + `MediaRecorder` — web standard.
- Realtime STT: OCI WebSocket + AudioWorklet — web standard.
- `chrome.*` coupling is thin — 4 touchpoints in the portable core:
  - `services/authService.ts` — token/user in `chrome.storage.local` (3 calls)
  - `services/apiClient.ts` — token clear on 401 (1 call)
  - `services/ociRealtimeService.ts` — token cache in `chrome.storage.local` (×2) and
    `chrome.runtime.getURL('pcm-worklet.js')` (1)
- `settingsStore` already uses `zustand/persist` (localStorage) → works in PWA as-is.
- Extension-only (NOT ported): `content/*`, `background/*`, `services/injectionService.ts`,
  and the `chrome.scripting` injection block in `NoteDetailScreen.tsx`.
- Backend already supports an async (offline-friendly) path:
  `POST /audio/transcribe-oracle` + `GET /audio/transcription-status/{jobId}`,
  result lands in the inbox. `GET /audio/oracle-token` for realtime.

## Architecture

Single project, single source of truth, two build targets.

```
extension-master/
├── src/
│   ├── platform/                  # NEW: adapter layer
│   │   ├── index.ts               # detect platform, export the right impl
│   │   ├── types.ts               # Platform interface
│   │   ├── platform.chrome.ts     # wraps chrome.storage + chrome.runtime.getURL
│   │   └── platform.web.ts        # IndexedDB/localStorage + static worklet path
│   ├── services/  store/  popup/  # SHARED (chrome calls replaced by platform.*)
│   ├── content/  background/      # extension-only (excluded from PWA build)
│   └── pwa/                       # NEW: PWA entry
│       ├── index.html             # manifest link + native meta + splash
│       ├── main.tsx               # BrowserRouter mount (or reuse popup/App)
│       ├── sw.ts                  # service worker (app-shell precache + offline)
│       └── offline/queue.ts       # IndexedDB audio upload queue
├── manifest.json                  # extension (unchanged)
├── manifest.webmanifest           # NEW: PWA manifest
├── vite.config.ts                 # extension build (unchanged)
└── vite.pwa.config.ts             # NEW: PWA build (vite-plugin-pwa)
```

### Platform Adapter

```ts
interface Platform {
  isExtension: boolean
  storage: {
    get(keys: string | string[]): Promise<Record<string, any>>
    set(obj: Record<string, any>): Promise<void>
    remove(keys: string | string[]): Promise<void>
  }
  assetUrl(path: string): string   // worklet & other packaged assets
}
```

- `platform.chrome.ts`: wraps `chrome.storage.local` and `chrome.runtime.getURL`.
- `platform.web.ts`: `storage` over **IndexedDB** (auth token — safer/larger than
  localStorage); `assetUrl` returns a static path (e.g. `/pcm-worklet.js`).
- Selection: `typeof chrome !== 'undefined' && chrome.storage` → chrome, else web.
- Edit surface = the 4 touchpoints above. No other logic changes.

## Native-Like Experience (top priority)

- **Manifest**: `display: standalone`, `theme_color`, maskable icons (192/512),
  Arabic+English name, `orientation: portrait`, app shortcut "تسجيل جديد".
- **Full-screen, no browser chrome**: `viewport-fit=cover` + `env(safe-area-inset-*)`;
  the floating record button respects `safe-area-inset-bottom`.
- **Install (A2HS)**: capture `beforeinstallprompt`, show a tasteful install invite in
  `ProfileMenu`; iOS shows "Add to Home Screen" guidance (no `beforeinstallprompt` there).
- **Splash + theme-color** consistent across light/dark.
- **Touch feel**: disable text selection & tap-highlight where appropriate,
  `overscroll-behavior: contain`, smooth page transitions, light haptics
  (`navigator.vibrate`) on record start/stop where supported, momentum scrolling,
  skeleton loaders, optimistic UI.
- **Connectivity**: slim top banner "غير متصل — سيُرفع لاحقاً" driven by online/offline.

## Data Flow

- **Online (unchanged)**: record → realtime OCI STT → save note → inbox.
- **Offline (new)**:
  1. Record locally (`MediaRecorder`), store blob + metadata (template, specialty,
     timestamp) in an **IndexedDB queue**.
  2. On reconnect (`online` event + Background Sync where supported): flush queue to
     `POST /audio/transcribe-oracle`, poll `transcription-status/{jobId}`, result → inbox.
  3. Per-item status UI: queued / uploading / done / failed(+retry).
  4. Delete audio blob from IndexedDB immediately after successful upload.
- **Cross-device sync**: free — inbox is server-side; reuse existing `useInboxPolling`.

## Feature-Gating

- `NoteDetailScreen`: wrap the `chrome.scripting` injection block in
  `if (platform.isExtension)`. In the PWA, replace with per-field **Copy** buttons +
  "Copy all" (Clipboard API). Zero extension code loaded in the PWA bundle.

## Security & Compliance

- Oracle-only preserved; same endpoints; no third-party provider; no backend changes.
- Auth token in IndexedDB; never in URL/query.
- HTTPS required (local dev via dev cert / tunnel).
- PWA CSP `connect-src`: backend + `*.oci.oraclecloud.com` / `wss://*.oci.oraclecloud.com`
  only (mirrors extension manifest policy).
- Offline audio purged from IndexedDB on successful upload.

## Testing

- **Unit**: platform adapter (chrome/web), offline queue (enqueue/flush/retry/purge).
- **Integration**: online record→save→inbox; offline record→auto-upload on reconnect.
- **Manual / Lighthouse**: PWA audit (installability, SW, performance), real-phone test
  over HTTPS tunnel.
- **Regression**: confirm the extension build (`vite.config.ts`) is unchanged and still
  loads/injects.

## Hosting

- Local dev only for now (HTTPS via dev cert or tunnel). Production hosting deferred.

## Out of Scope (YAGNI for v1)

- Push notifications.
- Native app-store packaging (Capacitor/TWA).
- Any new backend endpoints or provider changes.
