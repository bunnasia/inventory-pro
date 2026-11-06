/**
 * Offline-first inventory store backed by IndexedDB.
 *
 * All scan entries are persisted locally first. A future sync layer
 * (Shopify / Sumtracker) reads from this store and marks entries as synced.
 */

export interface ScanEntry {
  id: string
  barcode: string
  quantity: number
  note: string
  timestamp: number
  synced: boolean
}

const DB_NAME = "inventory-pro"
const DB_VERSION = 1
const STORE_NAME = "scans"

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" })
        store.createIndex("timestamp", "timestamp")
        store.createIndex("barcode", "barcode")
        store.createIndex("synced", "synced")
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function txStore(db: IDBDatabase, mode: IDBTransactionMode) {
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME)
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function addScan(entry: Omit<ScanEntry, "id" | "synced">): Promise<ScanEntry> {
  const db = await openDb()
  const full: ScanEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    synced: false,
  }
  await promisify(txStore(db, "readwrite").put(full))
  return full
}

export async function getAllScans(): Promise<ScanEntry[]> {
  const db = await openDb()
  const result = await promisify(txStore(db, "readonly").getAll() as IDBRequest<ScanEntry[]>)
  return result.sort((a, b) => b.timestamp - a.timestamp)
}

export async function updateScan(id: string, patch: Partial<ScanEntry>): Promise<void> {
  const db = await openDb()
  const store = txStore(db, "readwrite")
  const existing = await promisify(store.get(id) as IDBRequest<ScanEntry | undefined>)
  if (!existing) return
  await promisify(store.put({ ...existing, ...patch, id }))
}

export async function deleteScan(id: string): Promise<void> {
  const db = await openDb()
  await promisify(txStore(db, "readwrite").delete(id))
}

export async function clearAllScans(): Promise<void> {
  const db = await openDb()
  await promisify(txStore(db, "readwrite").clear())
}

export async function getUnsyncedScans(): Promise<ScanEntry[]> {
  const db = await openDb()
  const index = txStore(db, "readonly").index("synced")
  const result = await promisify(index.getAll(IDBKeyRange.only(false)) as IDBRequest<ScanEntry[]>)
  return result
}

export function exportCsv(scans: ScanEntry[]): string {
  const header = "id,barcode,quantity,note,timestamp,synced"
  const rows = scans.map((s) =>
    [s.id, s.barcode, s.quantity, `"${s.note.replace(/"/g, '""')}"`, s.timestamp, s.synced].join(","),
  )
  return [header, ...rows].join("\n")
}
