// IndexedDB cache — supports larger data and more entries
const DB_NAME = 'ai_detector_cache'
const STORE_NAME = 'results'
const DB_VERSION = 1
const CACHE_MAX = 100
const TTL_MS = 48 * 60 * 60 * 1000 // 48 hours

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'hash' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function hashText(text) {
  const encoder = new TextEncoder()
  const data = encoder.encode(text.trim())
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function getCachedResult(text) {
  try {
    const hash = await hashText(text)
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(hash)
      request.onsuccess = () => {
        const entry = request.result
        if (entry && Date.now() - entry.timestamp < TTL_MS) {
          resolve(entry.data)
        } else {
          if (entry) {
            // Delete expired
            const delTx = db.transaction(STORE_NAME, 'readwrite')
            delTx.objectStore(STORE_NAME).delete(hash)
          }
          resolve(null)
        }
      }
      request.onerror = () => resolve(null)
    })
  } catch {
    // Fallback to localStorage
    return _lsFallbackGet(text)
  }
}

export async function setCachedResult(text, data) {
  try {
    const hash = await hashText(text)
    const db = await openDB()

    // Check count and evict oldest if needed
    const tx1 = db.transaction(STORE_NAME, 'readonly')
    const store1 = tx1.objectStore(STORE_NAME)
    const countReq = store1.count()

    await new Promise((resolve) => {
      countReq.onsuccess = async () => {
        if (countReq.result >= CACHE_MAX) {
          // Evict oldest
          const evictTx = db.transaction(STORE_NAME, 'readwrite')
          const evictStore = evictTx.objectStore(STORE_NAME)
          const idx = evictStore.index('timestamp')
          const cursor = idx.openCursor()
          let deleted = 0
          cursor.onsuccess = (e) => {
            const c = e.target.result
            if (c && deleted < 10) {
              c.delete()
              deleted++
              c.continue()
            }
          }
        }
        resolve()
      }
      countReq.onerror = () => resolve()
    })

    // Insert
    const tx2 = db.transaction(STORE_NAME, 'readwrite')
    tx2.objectStore(STORE_NAME).put({ hash, data, timestamp: Date.now() })
  } catch {
    // Fallback to localStorage
    _lsFallbackSet(text, data)
  }
}

// localStorage fallback for browsers without IndexedDB
const LS_KEY = 'analysis_cache'

async function _lsFallbackGet(text) {
  try {
    const hash = await hashText(text)
    const saved = localStorage.getItem(LS_KEY)
    const cache = saved ? JSON.parse(saved) : {}
    const entry = cache[hash]
    if (entry && Date.now() - entry.timestamp < TTL_MS) return entry.data
    return null
  } catch { return null }
}

async function _lsFallbackSet(text, data) {
  try {
    const hash = await hashText(text)
    const saved = localStorage.getItem(LS_KEY)
    const cache = saved ? JSON.parse(saved) : {}
    const entries = Object.entries(cache)
    if (entries.length >= 20) {
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      delete cache[entries[0][0]]
    }
    cache[hash] = { data, timestamp: Date.now() }
    localStorage.setItem(LS_KEY, JSON.stringify(cache))
  } catch {}
}
