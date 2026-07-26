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
