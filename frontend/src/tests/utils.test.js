import { describe, it, expect, beforeEach } from 'vitest'
import { countWords } from '../utils/debounce'
import { generateShareLink, parseShareLink } from '../utils/share'

describe('countWords', () => {
  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0)
  })

  it('returns 0 for whitespace only', () => {
    expect(countWords('   ')).toBe(0)
  })

  it('counts single word', () => {
    expect(countWords('مرحبا')).toBe(1)
  })

  it('counts multiple words', () => {
    expect(countWords('هذا نص عربي للاختبار')).toBe(4)
  })

  it('handles extra whitespace', () => {
    expect(countWords('  كلمة  أخرى  ')).toBe(2)
  })
})

describe('share utilities', () => {
  const mockData = {
    result: { percentage: 75, level: 'مشبوه', color: 'orange', final_score: 0.75 },
    statistical: {
      ttr: 0.45,
      sentence_length_cv: 0.32,
      repetitive_openers_ratio: 0.15,
      connector_density: 2.1,
      error_ratio: 0.001,
      burstiness: 0.6,
      statistical_score: 0.55,
    },
    ml: { label: 'AI', confidence: 0.88, ml_score: 0.88 },
    sentences: [],
    metadata: { word_count: 200, sentence_count: 15, analysis_time_ms: 350 },
  }

  it('generates a share link', () => {
    const link = generateShareLink(mockData)
    expect(link).toContain('?share=')
  })

  it('round-trips share data', () => {
    const link = generateShareLink(mockData)
    // Extract the share param
    const shareParam = new URL(link).searchParams.get('share')

    // Manually set window.location.search
    delete window.location
    window.location = { search: `?share=${shareParam}`, origin: 'http://localhost', pathname: '/' }

    const parsed = parseShareLink()
    expect(parsed).not.toBeNull()
    expect(parsed.result.percentage).toBe(75)
    expect(parsed.ml.label).toBe('AI')
    expect(parsed.metadata.word_count).toBe(200)
  })
})
