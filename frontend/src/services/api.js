import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function analyzeText(text) {
  const response = await client.post('/api/analyze', {
    text,
    detailed: true,
  })
  return response.data
}

export async function checkHealth() {
  const response = await client.get('/api/health')
  return response.data
}
