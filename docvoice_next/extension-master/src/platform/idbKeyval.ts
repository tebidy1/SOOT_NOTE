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
