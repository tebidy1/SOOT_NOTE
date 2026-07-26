# SoutNote PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a native-feeling PWA from the existing Chrome extension so doctors can capture, transcribe, review, and copy medical notes on the go — online and offline — from one shared codebase.

**Architecture:** Keep the existing Vite/React project. Introduce a thin `platform/` adapter that abstracts the 4 `chrome.*` touchpoints (auth token storage, 401 token clear, OCI token cache, worklet asset URL) with a `chrome` impl and a `web` impl (IndexedDB). Add a second Vite build target (`vite.pwa.config.ts` + `vite-plugin-pwa`) that bundles only the React app as an installable PWA with a service worker and an IndexedDB offline audio-upload queue. Extension-only code (`content/`, `background/`, injection) is excluded from the PWA bundle and feature-gated in shared screens.

**Tech Stack:** React 18, Vite 4, TypeScript, Tailwind, Zustand, react-router (HashRouter), `vite-plugin-pwa` (Workbox), Vitest + jsdom (new test harness), raw IndexedDB (no new runtime dep).

**Working directory for all paths below:** `docvoice_next/extension-master/`

---

## File Structure

**Created:**
- `src/platform/types.ts` — `Platform` interface
- `src/platform/platform.chrome.ts` — chrome.storage + chrome.runtime.getURL impl
- `src/platform/platform.web.ts` — IndexedDB storage + static asset URL impl
- `src/platform/index.ts` — runtime detection, exports the active `platform`
- `src/platform/idbKeyval.ts` — tiny promise wrapper over IndexedDB (shared by web storage + queue)
- `src/pwa/index.html` — PWA entry HTML (native meta, manifest link, splash bg)
- `src/pwa/main.tsx` — PWA React mount (reuses `popup/App`)
- `src/pwa/offline/audioQueue.ts` — offline audio upload queue (IndexedDB)
- `src/pwa/offline/useOnlineStatus.ts` — online/offline hook
- `src/pwa/components/OfflineBanner.tsx` — connectivity banner
- `src/pwa/components/InstallPrompt.tsx` — A2HS install invite (+ iOS guidance)
- `manifest.webmanifest` — PWA manifest
- `public/pwa-icons/` — generated maskable PNG icons (192, 512) + apple-touch-icon
- `vite.pwa.config.ts` — PWA build config
- `vitest.config.ts` — test config
- Test files under `src/**/__tests__/`

**Modified:**
- `src/services/authService.ts` — replace `chrome.storage.local` with `platform.storage`
- `src/services/apiClient.ts` — replace `chrome.storage.local.remove` with `platform.storage.remove`
- `src/services/ociRealtimeService.ts` — replace chrome token cache + `chrome.runtime.getURL` with `platform.*`
- `src/services/audioRecordingService.ts` — enqueue to offline queue when offline
- `src/popup/screens/NoteDetailScreen.tsx` — gate injection behind `platform.isExtension`; add Copy buttons for PWA
- `src/popup/App.tsx` — mount `OfflineBanner` + `InstallPrompt`
- `src/styles/globals.css` — safe-area insets + native touch rules
- `package.json` — add scripts + dev deps

---

## Phase 0 — Test Harness & Dependencies

### Task 0: Install tooling

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install dev dependencies**

Run:
```bash
npm i -D vitest@^1 jsdom@^24 @testing-library/react@^14 @testing-library/jest-dom@^6 fake-indexeddb@^5 vite-plugin-pwa@^0.19 @vite-pwa/assets-generator@^0.2 sharp@^0.33
```
Expected: installs succeed; `vite-plugin-pwa` and `vitest` appear in `devDependencies`.

- [ ] **Step 2: Add scripts to `package.json`**

Add to the `"scripts"` block:
```json
"test": "vitest run",
"test:watch": "vitest",
"build:pwa": "vite build --config vite.pwa.config.ts",
"dev:pwa": "vite --config vite.pwa.config.ts",
"preview:pwa": "vite preview --config vite.pwa.config.ts --https"
```

- [ ] **Step 3: Create `vitest.config.ts`**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [resolve(__dirname, 'src/test/setup.ts')],
  },
})
```

- [ ] **Step 4: Create test setup**

Create `src/test/setup.ts`:
```ts
import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
```

- [ ] **Step 5: Smoke test that the harness runs**

Create `src/test/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
describe('harness', () => {
  it('runs', () => { expect(1 + 1).toBe(2) })
})
```

Run: `npm test`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test/setup.ts src/test/smoke.test.ts
git commit -m "chore: add vitest harness and PWA build deps"
```

---

## Phase 1 — Platform Adapter

### Task 1: Platform interface + IndexedDB key-val helper

**Files:**
- Create: `src/platform/types.ts`
- Create: `src/platform/idbKeyval.ts`
- Test: `src/platform/__tests__/idbKeyval.test.ts`

- [ ] **Step 1: Write the interface**

Create `src/platform/types.ts`:
```ts
export interface PlatformStorage {
  get(keys: string | string[]): Promise<Record<string, any>>
  set(obj: Record<string, any>): Promise<void>
  remove(keys: string | string[]): Promise<void>
}

export interface Platform {
  /** true when running as the Chrome extension, false in the PWA/web build */
  isExtension: boolean
  storage: PlatformStorage
  /** resolve a packaged asset (e.g. the PCM worklet) to a loadable URL */
  assetUrl(path: string): string
}
```

- [ ] **Step 2: Write the failing test for the IndexedDB helper**

Create `src/platform/__tests__/idbKeyval.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { idbGet, idbSet, idbDel, idbKeys } from '../idbKeyval'

describe('idbKeyval', () => {
  it('round-trips a value', async () => {
    await idbSet('foo', { a: 1 })
    expect(await idbGet('foo')).toEqual({ a: 1 })
  })
  it('deletes a value', async () => {
    await idbSet('bar', 2)
    await idbDel('bar')
    expect(await idbGet('bar')).toBeUndefined()
  })
  it('lists keys', async () => {
    await idbSet('k1', 1)
    await idbSet('k2', 2)
    const keys = await idbKeys()
    expect(keys).toEqual(expect.arrayContaining(['k1', 'k2']))
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- idbKeyval`
Expected: FAIL — cannot resolve `../idbKeyval`.

- [ ] **Step 4: Implement the helper**

Create `src/platform/idbKeyval.ts`:
```ts
const DB_NAME = 'soutnote'
const STORE = 'keyval'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const req = fn(t.objectStore(STORE))
    req.onsuccess = () => resolve(req.result as T)
    req.onerror = () => reject(req.error)
  })
}

export const idbGet = <T = any>(key: string) => tx<T>('readonly', s => s.get(key))
export const idbSet = (key: string, val: any) => tx<void>('readwrite', s => s.put(val, key))
export const idbDel = (key: string) => tx<void>('readwrite', s => s.delete(key))
export const idbKeys = () => tx<string[]>('readonly', s => s.getAllKeys() as IDBRequest<string[]>)
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- idbKeyval`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/platform/types.ts src/platform/idbKeyval.ts src/platform/__tests__/idbKeyval.test.ts
git commit -m "feat(platform): add Platform interface and IndexedDB keyval helper"
```

### Task 2: Web platform implementation

**Files:**
- Create: `src/platform/platform.web.ts`
- Test: `src/platform/__tests__/platform.web.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/platform/__tests__/platform.web.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- platform.web`
Expected: FAIL — cannot resolve `../platform.web`.

- [ ] **Step 3: Implement web platform**

Create `src/platform/platform.web.ts`:
```ts
import { Platform } from './types'
import { idbGet, idbSet, idbDel } from './idbKeyval'

const toArray = (keys: string | string[]) => (Array.isArray(keys) ? keys : [keys])

export const webPlatform: Platform = {
  isExtension: false,
  storage: {
    async get(keys) {
      const out: Record<string, any> = {}
      for (const k of toArray(keys)) {
        const v = await idbGet(k)
        if (v !== undefined) out[k] = v
      }
      return out
    },
    async set(obj) {
      for (const [k, v] of Object.entries(obj)) await idbSet(k, v)
    },
    async remove(keys) {
      for (const k of toArray(keys)) await idbDel(k)
    },
  },
  assetUrl(path) {
    return '/' + path.replace(/^\/+/, '')
  },
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- platform.web`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/platform/platform.web.ts src/platform/__tests__/platform.web.test.ts
git commit -m "feat(platform): add web (PWA) platform implementation over IndexedDB"
```

### Task 3: Chrome platform implementation + detection

**Files:**
- Create: `src/platform/platform.chrome.ts`
- Create: `src/platform/index.ts`
- Test: `src/platform/__tests__/index.test.ts`

- [ ] **Step 1: Implement chrome platform**

Create `src/platform/platform.chrome.ts`:
```ts
import { Platform } from './types'

export const chromePlatform: Platform = {
  isExtension: true,
  storage: {
    get: (keys) => chrome.storage.local.get(keys as any),
    set: (obj) => chrome.storage.local.set(obj),
    remove: (keys) => chrome.storage.local.remove(keys as any),
  },
  assetUrl: (path) => chrome.runtime.getURL(path),
}
```

- [ ] **Step 2: Write the failing detection test**

Create `src/platform/__tests__/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { detectPlatform } from '../index'
import { webPlatform } from '../platform.web'

describe('detectPlatform', () => {
  it('returns web platform when chrome.storage is unavailable', () => {
    expect(detectPlatform(undefined)).toBe(webPlatform)
  })
  it('returns web platform when chrome exists but storage does not', () => {
    expect(detectPlatform({} as any)).toBe(webPlatform)
  })
  it('returns extension platform when chrome.storage exists', () => {
    const fakeChrome = { storage: { local: {} } } as any
    expect(detectPlatform(fakeChrome).isExtension).toBe(true)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- platform/__tests__/index`
Expected: FAIL — cannot resolve `../index`.

- [ ] **Step 4: Implement detection + export active platform**

Create `src/platform/index.ts`:
```ts
import { Platform } from './types'
import { webPlatform } from './platform.web'
import { chromePlatform } from './platform.chrome'

export function detectPlatform(chromeGlobal: any): Platform {
  if (chromeGlobal && chromeGlobal.storage && chromeGlobal.storage.local) {
    return chromePlatform
  }
  return webPlatform
}

export const platform: Platform = detectPlatform(
  typeof chrome !== 'undefined' ? (chrome as any) : undefined
)

export type { Platform } from './types'
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- platform/__tests__/index`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/platform/platform.chrome.ts src/platform/index.ts src/platform/__tests__/index.test.ts
git commit -m "feat(platform): add chrome impl and runtime platform detection"
```

### Task 4: Route services through the platform adapter

**Files:**
- Modify: `src/services/authService.ts`
- Modify: `src/services/apiClient.ts:48`
- Modify: `src/services/ociRealtimeService.ts` (lines ~82-114, ~449)

- [ ] **Step 1: Update `authService.ts`**

Add at the top of the imports:
```ts
import { platform } from '../platform'
```
Replace the three `chrome.storage.local` calls:
- In `initializeFromStorage`: `const result = await chrome.storage.local.get(['authToken', 'user'])`
  → `const result = await platform.storage.get(['authToken', 'user'])`
- In `saveToChromeStorage`: `await chrome.storage.local.set({ authToken: token, user: user })`
  → `await platform.storage.set({ authToken: token, user: user })`
- In `clearChromeStorage`: `await chrome.storage.local.remove(['authToken', 'user'])`
  → `await platform.storage.remove(['authToken', 'user'])`

- [ ] **Step 2: Update `apiClient.ts:48`**

Add `import { platform } from '../platform'` near the top imports.
Replace `chrome.storage.local.remove(['authToken', 'user'])`
with `platform.storage.remove(['authToken', 'user'])`.

- [ ] **Step 3: Update `ociRealtimeService.ts`**

Add `import { platform } from '../platform'` near the top imports.
Replace the guarded chrome storage reads/writes:
- `if (typeof chrome === 'undefined' || !chrome.storage?.local) return` (read guard, ~line 82)
  → remove the guard's chrome check; use `const data = await platform.storage.get(this.TOKEN_STORAGE_KEY)`
- `chrome.storage.local.set({ [this.TOKEN_STORAGE_KEY]: ... })` (~line 105)
  → `platform.storage.set({ [this.TOKEN_STORAGE_KEY]: ... })`
- `chrome.storage.local.remove(this.TOKEN_STORAGE_KEY)` (~line 114)
  → `platform.storage.remove(this.TOKEN_STORAGE_KEY)`
- `const workletUrl = chrome.runtime.getURL('pcm-worklet.js')` (~line 449)
  → `const workletUrl = platform.assetUrl('pcm-worklet.js')`

Note: read the exact surrounding lines first (`Read` the file) to preserve the existing
caching logic; only swap the storage/URL mechanism, not the logic.

- [ ] **Step 4: Verify extension build still compiles**

Run: `npm run build`
Expected: build succeeds, `dist/` produced (extension unaffected — `platform` resolves to chrome impl there).

- [ ] **Step 5: Verify tests still pass**

Run: `npm test`
Expected: PASS (all prior tests).

- [ ] **Step 6: Commit**

```bash
git add src/services/authService.ts src/services/apiClient.ts src/services/ociRealtimeService.ts
git commit -m "refactor(services): route chrome.* through platform adapter"
```

---

## Phase 2 — PWA Build Target & App Shell

### Task 5: PWA manifest, icons, and entry HTML

**Files:**
- Create: `manifest.webmanifest`
- Create: `public/pwa-icons/` (generated)
- Create: `src/pwa/index.html`
- Create: `src/pwa/main.tsx`

- [ ] **Step 1: Generate maskable icons from the existing SVG**

Run:
```bash
npx @vite-pwa/assets-generator --preset minimal-2023 public/icons/icon.svg
```
If the generator output lands elsewhere, move the produced `pwa-192x192.png`,
`pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`
into `public/pwa-icons/`. Expected: PNGs exist in `public/pwa-icons/`.

- [ ] **Step 2: Create `manifest.webmanifest`**

Create `manifest.webmanifest` at repo `extension-master/` root:
```json
{
  "name": "SoutNote | صوت نوت",
  "short_name": "SoutNote",
  "description": "Medical voice recording, transcription, and note assistant",
  "lang": "ar",
  "dir": "rtl",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0F172A",
  "theme_color": "#0F172A",
  "icons": [
    { "src": "/pwa-icons/pwa-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/pwa-icons/pwa-512x512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/pwa-icons/maskable-icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "shortcuts": [
    { "name": "تسجيل جديد", "short_name": "تسجيل", "url": "/#/record" }
  ]
}
```

- [ ] **Step 3: Create `src/pwa/index.html`**

Create `src/pwa/index.html`:
```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no" />
  <meta name="theme-color" content="#0F172A" media="(prefers-color-scheme: dark)" />
  <meta name="theme-color" content="#F0F4F8" media="(prefers-color-scheme: light)" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="SoutNote" />
  <link rel="apple-touch-icon" href="/pwa-icons/apple-touch-icon-180x180.png" />
  <link rel="manifest" href="/manifest.webmanifest" />
  <title>SoutNote | صوت نوت</title>
  <link rel="stylesheet" href="../styles/globals.css" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
```

- [ ] **Step 4: Create `src/pwa/main.tsx` (reuse the existing App)**

Create `src/pwa/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../popup/App'
import '../popup/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 5: Copy the worklet into the PWA public dir**

Run:
```bash
mkdir -p public && cp src/popup/public/pcm-worklet.js public/pcm-worklet.js
```
Expected: `public/pcm-worklet.js` exists (served at `/pcm-worklet.js`, matching `webPlatform.assetUrl`).

- [ ] **Step 6: Commit**

```bash
git add manifest.webmanifest public/pwa-icons public/pcm-worklet.js src/pwa/index.html src/pwa/main.tsx
git commit -m "feat(pwa): add manifest, maskable icons, and PWA entry shell"
```

### Task 6: PWA Vite config with service worker

**Files:**
- Create: `vite.pwa.config.ts`

- [ ] **Step 1: Create `vite.pwa.config.ts`**

Create `vite.pwa.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  root: resolve(__dirname, 'src/pwa'),
  publicDir: resolve(__dirname, 'public'),
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      manifest: false, // we ship our own manifest.webmanifest
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: { cacheName: 'api', networkTimeoutSeconds: 5 },
          },
        ],
      },
      devOptions: { enabled: true },
    }),
  ],
  build: {
    outDir: resolve(__dirname, 'dist-pwa'),
    emptyOutDir: true,
  },
  server: { host: true },
})
```

- [ ] **Step 2: Ensure `manifest.webmanifest` is served**

Run:
```bash
cp manifest.webmanifest public/manifest.webmanifest
```
Expected: `public/manifest.webmanifest` exists (so `publicDir` serves it at `/manifest.webmanifest`).

- [ ] **Step 3: Build the PWA**

Run: `npm run build:pwa`
Expected: `dist-pwa/` produced, includes `sw.js`/`workbox-*.js`, `manifest.webmanifest`, icons, `pcm-worklet.js`.

- [ ] **Step 4: Register the service worker in the app**

In `src/pwa/main.tsx`, add before `ReactDOM.createRoot`:
```tsx
import { registerSW } from 'virtual:pwa-register'
registerSW({ immediate: true })
```
Add a type reference so TS resolves the virtual module — create `src/pwa/vite-env.d.ts`:
```ts
/// <reference types="vite-plugin-pwa/client" />
```

- [ ] **Step 5: Rebuild to confirm SW registration compiles**

Run: `npm run build:pwa`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add vite.pwa.config.ts public/manifest.webmanifest src/pwa/main.tsx src/pwa/vite-env.d.ts
git commit -m "feat(pwa): add PWA vite build with Workbox service worker"
```

---

## Phase 3 — Connectivity UX

### Task 7: Online status hook + offline banner

**Files:**
- Create: `src/pwa/offline/useOnlineStatus.ts`
- Create: `src/pwa/components/OfflineBanner.tsx`
- Test: `src/pwa/offline/__tests__/useOnlineStatus.test.tsx`
- Modify: `src/popup/App.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/pwa/offline/__tests__/useOnlineStatus.test.tsx`:
```tsx
import { describe, it, expect, act } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useOnlineStatus } from '../useOnlineStatus'

describe('useOnlineStatus', () => {
  it('reflects navigator.onLine and reacts to events', () => {
    const { result } = renderHook(() => useOnlineStatus())
    expect(typeof result.current).toBe('boolean')
    act(() => { window.dispatchEvent(new Event('offline')) })
    expect(result.current).toBe(false)
    act(() => { window.dispatchEvent(new Event('online')) })
    expect(result.current).toBe(true)
  })
})
```
(If `act` is not exported by your vitest version, import it from `@testing-library/react`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- useOnlineStatus`
Expected: FAIL — cannot resolve `../useOnlineStatus`.

- [ ] **Step 3: Implement the hook**

Create `src/pwa/offline/useOnlineStatus.ts`:
```ts
import { useEffect, useState } from 'react'

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- useOnlineStatus`
Expected: PASS.

- [ ] **Step 5: Implement the banner**

Create `src/pwa/components/OfflineBanner.tsx`:
```tsx
import { useOnlineStatus } from '../offline/useOnlineStatus'

export default function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <div
      dir="rtl"
      className="fixed top-0 left-0 right-0 z-[200] bg-amber-500 text-amber-950 text-center text-sm font-medium py-1 px-3"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 4px)' }}
    >
      غير متصل — سيتم رفع التسجيلات تلقائياً عند عودة الاتصال
    </div>
  )
}
```

- [ ] **Step 6: Mount it in `App.tsx`**

In `src/popup/App.tsx`, import at top:
```tsx
import OfflineBanner from '../pwa/components/OfflineBanner'
```
Render `<OfflineBanner />` just inside the outer `<div>` of the `<Router>` return, before `<Routes>`.
(The banner renders nothing in the extension when online, and the extension is generally online — harmless there.)

- [ ] **Step 7: Run tests + commit**

Run: `npm test`
Expected: PASS.
```bash
git add src/pwa/offline/useOnlineStatus.ts src/pwa/components/OfflineBanner.tsx src/pwa/offline/__tests__/useOnlineStatus.test.tsx src/popup/App.tsx
git commit -m "feat(pwa): add online-status hook and offline banner"
```

---

## Phase 4 — Offline Audio Queue

### Task 8: Audio queue store (IndexedDB)

**Files:**
- Create: `src/pwa/offline/audioQueue.ts`
- Test: `src/pwa/offline/__tests__/audioQueue.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/pwa/offline/__tests__/audioQueue.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- audioQueue`
Expected: FAIL — cannot resolve `../audioQueue`.

- [ ] **Step 3: Implement the queue**

Create `src/pwa/offline/audioQueue.ts`:
```ts
import { idbGet, idbSet } from '../../platform/idbKeyval'

export type QueueStatus = 'queued' | 'uploading' | 'done' | 'failed'

export interface QueueItem {
  id: string
  blob: Blob
  templateId: string | null
  specialty: string
  status: QueueStatus
  createdAt: number
  error?: string
}

const KEY = 'audioQueue'

async function readAll(): Promise<QueueItem[]> {
  return (await idbGet<QueueItem[]>(KEY)) || []
}
async function writeAll(items: QueueItem[]): Promise<void> {
  await idbSet(KEY, items)
}

export async function enqueue(input: {
  blob: Blob
  templateId: string | null
  specialty: string
}): Promise<string> {
  const items = await readAll()
  const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  items.push({ ...input, id, status: 'queued', createdAt: Date.now() })
  await writeAll(items)
  return id
}

export async function listQueue(): Promise<QueueItem[]> {
  return readAll()
}

export async function markStatus(id: string, status: QueueStatus, error?: string): Promise<void> {
  const items = await readAll()
  const i = items.findIndex(x => x.id === id)
  if (i >= 0) {
    items[i] = { ...items[i], status, error }
    await writeAll(items)
  }
}

export async function dequeue(id: string): Promise<void> {
  const items = await readAll()
  await writeAll(items.filter(x => x.id !== id))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- audioQueue`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pwa/offline/audioQueue.ts src/pwa/offline/__tests__/audioQueue.test.ts
git commit -m "feat(pwa): add offline audio queue over IndexedDB"
```

### Task 9: Queue flusher (upload on reconnect)

**Files:**
- Create: `src/pwa/offline/flushQueue.ts`
- Test: `src/pwa/offline/__tests__/flushQueue.test.ts`

- [ ] **Step 1: Confirm the upload API shape**

Read `src/services/apiClient.ts` and note the method used to POST audio for async
transcription (the endpoint is `POST /audio/transcribe-oracle`). If no method exists,
this task adds a thin `apiClient.transcribeOracle(formData)` wrapper. Read the file
first to match the existing axios instance and auth-header pattern.

- [ ] **Step 2: Write the failing test (uploader injected for testability)**

Create `src/pwa/offline/__tests__/flushQueue.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { enqueue, listQueue } from '../audioQueue'
import { flushQueue } from '../flushQueue'

const blob = () => new Blob([new Uint8Array([1])], { type: 'audio/webm' })

describe('flushQueue', () => {
  it('uploads queued items and removes them on success', async () => {
    await enqueue({ blob: blob(), templateId: 't1', specialty: 'x' })
    const uploader = vi.fn().mockResolvedValue({ ok: true })
    await flushQueue(uploader)
    expect(uploader).toHaveBeenCalledTimes(1)
    const remaining = (await listQueue()).filter(i => i.status !== 'done')
    expect(remaining.length).toBe(0)
  })
  it('marks items failed when upload throws, keeping them queued', async () => {
    await enqueue({ blob: blob(), templateId: null, specialty: '' })
    const uploader = vi.fn().mockRejectedValue(new Error('network'))
    await flushQueue(uploader)
    const failed = (await listQueue()).find(i => i.status === 'failed')
    expect(failed).toBeTruthy()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- flushQueue`
Expected: FAIL — cannot resolve `../flushQueue`.

- [ ] **Step 4: Implement the flusher**

Create `src/pwa/offline/flushQueue.ts`:
```ts
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
        await dequeue(item.id) // purge audio blob on success (privacy)
      } catch (e: any) {
        await markStatus(item.id, 'failed', e?.message || 'upload failed')
      }
    }
  } finally {
    flushing = false
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- flushQueue`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/pwa/offline/flushQueue.ts src/pwa/offline/__tests__/flushQueue.test.ts
git commit -m "feat(pwa): add queue flusher that uploads on reconnect and purges blobs"
```

### Task 10: Wire recording → queue when offline; flush on online

**Files:**
- Modify: `src/services/audioRecordingService.ts`
- Modify: `src/services/apiClient.ts` (add `transcribeOracle` if missing)
- Modify: `src/pwa/main.tsx` (register a flush-on-online listener)

- [ ] **Step 1: Add `transcribeOracle` uploader to `apiClient.ts` if absent**

Read `apiClient.ts`. If there is no method that posts to `/audio/transcribe-oracle`,
add one mirroring the existing request/auth pattern (multipart FormData):
```ts
async transcribeOracle(form: FormData) {
  return this.client.post('/audio/transcribe-oracle', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
```
(Use the same axios instance/property name already present in the file — read it first.)

- [ ] **Step 2: Enqueue on offline in `audioRecordingService.ts`**

In `stopRecording()` (where the final blob is assembled), branch on connectivity.
Add import: `import { enqueue } from '../pwa/offline/audioQueue'`.
Where the recording finishes and would normally be handed to realtime/save, add:
```ts
if (typeof navigator !== 'undefined' && !navigator.onLine) {
  const store = useRecordingStore.getState()
  await enqueue({
    blob: new Blob(this.audioChunks, { type: 'audio/webm' }),
    templateId: store.selectedTemplateId ?? null,
    specialty: useSettingsStore.getState().doctorSpecialty,
  })
  store.setOfflineQueued?.(true)
  return
}
```
Read the file first to match the actual store field names (`selectedTemplateId`,
`doctorSpecialty`) — adjust to whatever exists. Import `useSettingsStore` if not already imported.

- [ ] **Step 3: Register flush-on-online in `src/pwa/main.tsx`**

Add:
```tsx
import { flushQueue } from '../pwa/offline/flushQueue'
import { listQueue } from '../pwa/offline/audioQueue'
import { apiClient } from '../services/apiClient'

const uploader = async (item: import('../pwa/offline/audioQueue').QueueItem) => {
  const form = new FormData()
  form.append('audio', item.blob, 'recording.webm')
  if (item.templateId) form.append('macro_id', item.templateId)
  if (item.specialty) form.append('doctor_specialty', item.specialty)
  return apiClient.transcribeOracle(form)
}

window.addEventListener('online', () => { flushQueue(uploader) })
// attempt a flush on startup in case items are pending
listQueue().then(items => { if (items.length) flushQueue(uploader) })
```
(Confirm the multipart field names — `audio`, `macro_id`, `doctor_specialty` —
against `AudioController::transcribeOracle` request validation; adjust to match.)

- [ ] **Step 4: Build + test**

Run: `npm run build:pwa && npm test`
Expected: PWA build succeeds; all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/services/audioRecordingService.ts src/services/apiClient.ts src/pwa/main.tsx
git commit -m "feat(pwa): enqueue recordings when offline and auto-flush on reconnect"
```

---

## Phase 5 — Native-Like Polish

### Task 11: Safe-area + touch CSS

**Files:**
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Append native touch + safe-area rules**

Add to `src/styles/globals.css`:
```css
/* --- Native-like PWA behavior --- */
html, body {
  height: 100%;
  overscroll-behavior: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
/* Prevent accidental text selection on controls (keep it for note text areas) */
button, nav, .no-select { user-select: none; -webkit-user-select: none; }
/* iOS momentum scrolling for scroll containers */
.scroll-y { -webkit-overflow-scrolling: touch; overflow-y: auto; }
```

- [ ] **Step 2: Make the floating record button respect the home indicator**

In `src/popup/components/BottomNav.tsx`, on the fixed bottom bar `div`
(`className="fixed bottom-0 ..."`), add an inline style:
```tsx
style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
```
Read the file first and attach it to the existing bottom bar container without
removing current classes.

- [ ] **Step 3: Build + manual check**

Run: `npm run build:pwa`
Expected: build succeeds. (Visual verification happens in Task 14.)

- [ ] **Step 4: Commit**

```bash
git add src/styles/globals.css src/popup/components/BottomNav.tsx
git commit -m "feat(pwa): safe-area insets and native touch behavior"
```

### Task 12: Install prompt (A2HS) + haptics

**Files:**
- Create: `src/pwa/components/InstallPrompt.tsx`
- Modify: `src/popup/App.tsx`
- Modify: `src/services/audioRecordingService.ts` (haptics)

- [ ] **Step 1: Implement the install prompt component**

Create `src/pwa/components/InstallPrompt.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { platform } from '../../platform'

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (platform.isExtension) return
    const handler = (e: any) => { e.preventDefault(); setDeferred(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true)

  if (platform.isExtension || dismissed || isStandalone || !deferred) return null

  return (
    <div dir="rtl" className="fixed bottom-20 left-4 right-4 z-[150] bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl p-4 flex items-center gap-3">
      <div className="flex-1 text-sm text-gray-800 dark:text-gray-100">
        ثبّت SoutNote على شاشتك الرئيسية لتجربة أسرع وأشبه بالتطبيق.
      </div>
      <button
        onClick={async () => { deferred.prompt(); await deferred.userChoice; setDeferred(null) }}
        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium"
      >تثبيت</button>
      <button onClick={() => setDismissed(true)} aria-label="إغلاق" className="text-gray-400 px-2">✕</button>
    </div>
  )
}
```

- [ ] **Step 2: Mount in `App.tsx`**

In `src/popup/App.tsx` import and render `<InstallPrompt />` alongside `<OfflineBanner />`.

- [ ] **Step 3: Add haptics on record start/stop**

In `src/services/audioRecordingService.ts`, in `startRecording()` after the mic
stream is acquired, and in `stopRecording()` when recording actually stops, add:
```ts
if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(15)
```

- [ ] **Step 4: Build + commit**

Run: `npm run build:pwa`
Expected: build succeeds.
```bash
git add src/pwa/components/InstallPrompt.tsx src/popup/App.tsx src/services/audioRecordingService.ts
git commit -m "feat(pwa): add A2HS install prompt and record haptics"
```

---

## Phase 6 — Feature Gating (Injection → Copy)

### Task 13: Gate injection; add per-field Copy in the PWA

**Files:**
- Modify: `src/popup/screens/NoteDetailScreen.tsx`

- [ ] **Step 1: Read the injection block**

Read `src/popup/screens/NoteDetailScreen.tsx` around lines 500-590 (the
`chrome.tabs.query` / `chrome.scripting.executeScript` calls) and note the handler
that triggers injection and the button(s) that call it.

- [ ] **Step 2: Import the platform + guard the injection handler**

Add `import { platform } from '../../platform'` at the top.
Wrap the body of the injection handler so it early-returns in the PWA:
```ts
if (!platform.isExtension) return
```
And render the "Fill form" / inject button only when `platform.isExtension` is true:
```tsx
{platform.isExtension && (
  /* existing inject button JSX */
)}
```

- [ ] **Step 3: Add a Copy control for the PWA**

Add a small helper inside the component:
```tsx
const copyText = async (text: string) => {
  try { await navigator.clipboard.writeText(text) } catch { /* ignore */ }
  if ('vibrate' in navigator) navigator.vibrate(10)
}
```
Render, only when `!platform.isExtension`, a "نسخ الكل" button that copies the full
note text, plus a small copy icon per field next to each rendered field value.
Reuse the same field data the injection path already reads (the mapped fields object),
so no new data source is introduced.

- [ ] **Step 4: Build both targets**

Run: `npm run build && npm run build:pwa`
Expected: both builds succeed. Extension keeps injection; PWA shows Copy controls.

- [ ] **Step 5: Commit**

```bash
git add src/popup/screens/NoteDetailScreen.tsx
git commit -m "feat: gate EHR injection to extension; add copy controls in PWA"
```

---

## Phase 7 — Verification

### Task 14: Local HTTPS run, Lighthouse, and regression

**Files:** none (verification only)

- [ ] **Step 1: Serve the PWA over HTTPS locally**

Run: `npm run preview:pwa`
(If `--https` needs a cert, use `npm run dev:pwa -- --host` and a tunnel such as your
preferred HTTPS dev proxy. PWAs require HTTPS or localhost.)
Expected: app loads at the printed URL.

- [ ] **Step 2: Verify installability + service worker**

In the browser DevTools → Application: confirm the manifest is detected, icons load,
a service worker is activated, and the "Install" affordance appears.
Expected: all present, no manifest errors.

- [ ] **Step 3: Functional smoke (online)**

Log in, record a short note, confirm realtime transcription still works, save, and see
it in the inbox. Open a note and confirm "نسخ الكل" copies text.
Expected: full online flow works; no `chrome is not defined` errors in console.

- [ ] **Step 4: Functional smoke (offline)**

DevTools → Network → Offline. Record a note; confirm the offline banner shows and the
item is queued (Application → IndexedDB → `soutnote` → `audioQueue`). Go back online;
confirm the item uploads, is removed from the queue, and appears in the inbox.
Expected: offline capture + auto-upload works; blob purged after success.

- [ ] **Step 5: Lighthouse PWA audit**

Run Lighthouse (PWA + Performance categories) on the preview URL.
Expected: installable, PWA checks pass; note any performance items to address.

- [ ] **Step 6: Extension regression**

Run: `npm run build`, load `dist/` as an unpacked extension, confirm the side panel
opens, recording works, and field injection into a test form still works.
Expected: extension unchanged and fully functional.

- [ ] **Step 7: Final test run + commit any fixes**

Run: `npm test`
Expected: all tests pass. Commit any fixes found during verification.

---

## Self-Review Notes (author)

- **Spec coverage:** platform adapter (Tasks 1-4) ✓; PWA build + manifest + icons +
  SW (Tasks 5-6) ✓; native-like meta/safe-area/touch/haptics/install (Tasks 11-12) ✓;
  offline queue + flush + wiring (Tasks 8-10) ✓; connectivity banner (Task 7) ✓;
  feature-gating injection→copy (Task 13) ✓; Oracle-only preserved (no backend/provider
  changes anywhere) ✓; token in IndexedDB, never in URL (Task 2/4) ✓; verification incl.
  extension regression (Task 14) ✓.
- **Assumptions to confirm during execution (read the file first, then adapt):**
  exact `recordingStore` field names (`selectedTemplateId`, `setOfflineQueued`), the
  `apiClient` axios instance property name, `AudioController::transcribeOracle` multipart
  field names, and exact line ranges in `ociRealtimeService.ts` / `NoteDetailScreen.tsx`.
  These are the only places the plan says "read first, then match."
- **DRY:** PWA reuses `popup/App` and all shared services/stores; no duplicated screens.
- **YAGNI:** no push, no store packaging, no backend changes in v1.
