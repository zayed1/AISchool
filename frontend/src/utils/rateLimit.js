// #13 — Client-side rate limiting
const RATE_KEY = 'rate_limit'
const MAX_PER_HOUR = 20
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

export function getRateLimitInfo() {
  try {
    const saved = localStorage.getItem(RATE_KEY)
    const data = saved ? JSON.parse(saved) : { timestamps: [] }

    // Clean old timestamps
    const now = Date.now()
    data.timestamps = data.timestamps.filter((t) => now - t < WINDOW_MS)
    localStorage.setItem(RATE_KEY, JSON.stringify(data))

    return {
      remaining: Math.max(0, MAX_PER_HOUR - data.timestamps.length),
      total: MAX_PER_HOUR,
      used: data.timestamps.length,
      nextReset: data.timestamps.length > 0
        ? Math.ceil((data.timestamps[0] + WINDOW_MS - now) / 60000)
        : 0,
    }
  } catch {
    return { remaining: MAX_PER_HOUR, total: MAX_PER_HOUR, used: 0, nextReset: 0 }
  }
}

export function recordAnalysis() {
  try {
    const saved = localStorage.getItem(RATE_KEY)
    const data = saved ? JSON.parse(saved) : { timestamps: [] }
    const now = Date.now()
    data.timestamps = data.timestamps.filter((t) => now - t < WINDOW_MS)
    data.timestamps.push(now)
    localStorage.setItem(RATE_KEY, JSON.stringify(data))
    return getRateLimitInfo()
  } catch {
    return getRateLimitInfo()
  }
}

export function canAnalyze() {
  return getRateLimitInfo().remaining > 0
}
