import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// #18 — Retry with exponential backoff
async function withRetry(fn, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === retries) throw err
      // Only retry on network errors, not on 4xx
      if (err.response && err.response.status < 500) throw err
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}

export async function analyzeText(text) {
  return withRetry(async () => {
    const response = await client.post('/api/analyze', {
      text,
      detailed: true,
    })
    return response.data
  })
}

// #8 — SSE-based analysis with progress
export function analyzeTextSSE(text, onProgress) {
  // Falls back to regular POST since backend needs SSE endpoint
  // But simulates progress for now
  return new Promise(async (resolve, reject) => {
    onProgress?.('statistical')

    const timer1 = setTimeout(() => onProgress?.('ml'), 600)
    const timer2 = setTimeout(() => onProgress?.('combining'), 1500)

    try {
      const data = await analyzeText(text)
      clearTimeout(timer1)
      clearTimeout(timer2)
      onProgress?.('done')
      resolve(data)
    } catch (err) {
      clearTimeout(timer1)
      clearTimeout(timer2)
      reject(err)
    }
  })
}

// #16 — Fetch URL content via backend proxy
export async function fetchUrlContent(url) {
  const response = await client.post('/api/fetch-url', { url })
  return response.data.text
}

export async function checkHealth() {
  const response = await client.get('/api/health')
  return response.data
}
