export interface PlatformStorage {
  get(keys: string | string[]): Promise<Record<string, any>>
  set(obj: Record<string, any>): Promise<void>
  remove(keys: string | string[]): Promise<void>
}

export interface Platform {
  isExtension: boolean
  storage: PlatformStorage
  assetUrl(path: string): string
}
