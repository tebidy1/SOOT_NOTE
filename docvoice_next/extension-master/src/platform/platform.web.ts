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
