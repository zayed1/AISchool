import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

async function withRetry(fn, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === retries) throw err
      if (err.response && err.response.status < 500) throw err
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}

export async function analyzeText(text) {
  return withRetry(async () => {
    const response = await client.post('/api/analyze', { text, detailed: true })
    return response.data
  })
}

// Real SSE streaming analysis
export function analyzeTextSSE(text, onProgress) {
  return new Promise((resolve, reject) => {
    onProgress?.('statistical')

    // Try real SSE endpoint first
    const controller = new AbortController()
    fetch(`${API_URL}/api/analyze-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, detailed: true }),
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok || !response.body) {
        // Fallback to regular POST with simulated progress
        throw new Error('SSE not available')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.step === 'done') {
                onProgress?.('done')
                resolve({
                  result: data.result,
                  statistical: data.statistical,
                  ml: data.ml,
                  sentences: data.sentences,
                  metadata: data.metadata,
                })
                return
              }
              onProgress?.(data.step)
            } catch {}
          }
        }
      }

      // If we got here without a done event, fallback
      throw new Error('Stream ended without result')
    }).catch(async () => {
      // Fallback: regular POST with simulated progress
      controller.abort()
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
  })
}

export async function fetchUrlContent(url) {
  const response = await client.post('/api/fetch-url', { url })
  return response.data.text
}

export async function checkHealth() {
  const response = await client.get('/api/health')
  return response.data
}
