// #1 — Hash-based cache for analysis results
const CACHE_KEY = 'analysis_cache'
const CACHE_MAX = 20

async function hashText(text) {
  const encoder = new TextEncoder()
  const data = encoder.encode(text.trim())
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function getCache() {
  try {
    const saved = localStorage.getItem(CACHE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

function setCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {}
}

export async function getCachedResult(text) {
  const hash = await hashText(text)
  const cache = getCache()
  const entry = cache[hash]
  if (entry) {
    // Check if cache is less than 24 hours old
    if (Date.now() - entry.timestamp < 24 * 60 * 60 * 1000) {
      return entry.data
    }
    delete cache[hash]
    setCache(cache)
  }
  return null
}

export async function setCachedResult(text, data) {
  const hash = await hashText(text)
  const cache = getCache()

  // Evict oldest if at capacity
  const entries = Object.entries(cache)
  if (entries.length >= CACHE_MAX) {
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    delete cache[entries[0][0]]
  }

  cache[hash] = { data, timestamp: Date.now() }
  setCache(cache)
}
