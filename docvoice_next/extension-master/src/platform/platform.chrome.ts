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
