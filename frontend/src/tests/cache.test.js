import { describe, it, expect, beforeEach } from 'vitest'
import { getCachedResult, setCachedResult } from '../utils/cache'

describe('Analysis cache', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null for uncached text', async () => {
    const result = await getCachedResult('some text that was never analyzed')
    expect(result).toBeNull()
  })

  it('caches and retrieves results', async () => {
    const mockData = { result: { percentage: 50 } }
    await setCachedResult('test text for caching', mockData)

    const cached = await getCachedResult('test text for caching')
    expect(cached).toEqual(mockData)
  })

  it('returns null for different text', async () => {
    const mockData = { result: { percentage: 50 } }
    await setCachedResult('text A', mockData)

    const cached = await getCachedResult('text B')
    expect(cached).toBeNull()
  })

  it('trims text before hashing', async () => {
    const mockData = { result: { percentage: 50 } }
    await setCachedResult('  hello world  ', mockData)

    const cached = await getCachedResult('hello world')
    expect(cached).toEqual(mockData)
  })
})
