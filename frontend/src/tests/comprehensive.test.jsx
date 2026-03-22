import { describe, it, expect, vi, beforeEach } from 'vitest'

// ===== UTILITY TESTS =====

describe('countWords', () => {
  it('counts Arabic words correctly', async () => {
    const { countWords } = await import('../utils/debounce')
    expect(countWords('مرحبا بالعالم')).toBe(2)
    const wc = countWords('هذا نص طويل جداً يحتوي على عدة كلمات')
    expect(wc).toBeGreaterThanOrEqual(6)
  })

  it('returns 0 for empty string', async () => {
    const { countWords } = await import('../utils/debounce')
    expect(countWords('')).toBe(0)
    expect(countWords('   ')).toBe(0)
  })

  it('handles mixed Arabic-English text', async () => {
    const { countWords } = await import('../utils/debounce')
    expect(countWords('Hello مرحبا World عالم')).toBe(4)
  })
})

describe('rateLimit', () => {
  beforeEach(() => { localStorage.clear() })

  it('starts with full capacity', async () => {
    const { getRateLimitInfo } = await import('../utils/rateLimit')
    const info = getRateLimitInfo()
    expect(info.remaining).toBe(20)
    expect(info.total).toBe(20)
    expect(info.used).toBe(0)
  })

  it('records analysis and decrements remaining', async () => {
    const { recordAnalysis, getRateLimitInfo } = await import('../utils/rateLimit')
    recordAnalysis()
    const info = getRateLimitInfo()
    expect(info.remaining).toBe(19)
    expect(info.used).toBe(1)
  })

  it('canAnalyze returns true when under limit', async () => {
    const { canAnalyze } = await import('../utils/rateLimit')
    expect(canAnalyze()).toBe(true)
  })
})

describe('honeypot', () => {
  it('detects bot when honeypot is filled', async () => {
    const { isBot } = await import('../utils/honeypot')
    expect(isBot('')).toBeFalsy()
    expect(isBot(null)).toBeFalsy()
    expect(isBot('bot data')).toBeTruthy()
  })

  it('detects fast submission', async () => {
    const { isTooFast, createTimestamp } = await import('../utils/honeypot')
    const ts = createTimestamp()
    expect(isTooFast(ts, 5000)).toBe(true)
  })
})

describe('cache (IndexedDB with fallback)', () => {
  beforeEach(() => { localStorage.clear() })

  it('returns null for uncached text', async () => {
    const { getCachedResult } = await import('../utils/cache')
    const result = await getCachedResult('test text that is not cached')
    expect(result).toBeNull()
  })

  it('caches and retrieves result', async () => {
    const { getCachedResult, setCachedResult } = await import('../utils/cache')
    const mockData = { result: { percentage: 75 } }
    await setCachedResult('my test text for caching', mockData)
    const result = await getCachedResult('my test text for caching')
    expect(result).toEqual(mockData)
  })
})

describe('share', () => {
  it('generates share link from data', async () => {
    const { generateShareLink } = await import('../utils/share')
    const data = {
      result: { final_score: 0.5, percentage: 50, level: 'غير واضح', color: 'yellow' },
      statistical: { ttr: 0.5, sentence_length_cv: 0.3, repetitive_openers_ratio: 0.1, connector_density: 1, error_ratio: 0.01, burstiness: 0.3, statistical_score: 0.5 },
      ml: { label: 'AI', confidence: 0.7, ml_score: 0.7 },
      sentences: [],
      metadata: { word_count: 100, sentence_count: 10, analysis_time_ms: 200 },
    }
    const link = generateShareLink(data)
    expect(link).toBeTruthy()
    expect(link).toContain('?share=')
  })

  it('parses share link correctly', async () => {
    const { generateShareLink, parseShareLink } = await import('../utils/share')
    const data = {
      result: { final_score: 0.5, percentage: 50, level: 'test', color: 'yellow' },
      statistical: { ttr: 0.5, sentence_length_cv: 0.3, repetitive_openers_ratio: 0.1, connector_density: 1, error_ratio: 0.01, burstiness: 0.3, statistical_score: 0.5 },
      ml: { label: 'AI', confidence: 0.7, ml_score: 0.7 },
      sentences: [],
      metadata: { word_count: 100, sentence_count: 10, analysis_time_ms: 200 },
    }
    const link = generateShareLink(data)
    // Simulate URL
    const shareParam = new URL(link).searchParams.get('share')
    delete window.location
    window.location = new URL(`http://localhost?share=${shareParam}`)
    const parsed = parseShareLink()
    if (parsed) {
      expect(parsed.result.percentage).toBe(50)
    }
  })
})

describe('docxExport', () => {
  it('exports without error', async () => {
    const { exportReportAsDOCX } = await import('../utils/docxExport')
    // Mock createElement and click
    const mockClick = vi.fn()
    const mockCreateElement = vi.spyOn(document, 'createElement')
    const origCreateObjectURL = URL.createObjectURL
    URL.createObjectURL = vi.fn(() => 'blob:test')
    URL.revokeObjectURL = vi.fn()

    const mockAnchor = { href: '', download: '', click: mockClick }
    mockCreateElement.mockReturnValue(mockAnchor)

    const data = {
      result: { percentage: 50, level: 'test', color: 'yellow' },
      statistical: { ttr: 0.5, sentence_length_cv: 0.3, repetitive_openers_ratio: 0.1, connector_density: 1, error_ratio: 0.01, burstiness: 0.3, statistical_score: 0.5 },
      ml: { label: 'AI', confidence: 0.7, ml_score: 0.7 },
      metadata: { word_count: 100, sentence_count: 10, analysis_time_ms: 200 },
    }

    exportReportAsDOCX(data)
    expect(mockClick).toHaveBeenCalled()

    mockCreateElement.mockRestore()
    URL.createObjectURL = origCreateObjectURL
  })
})

// ===== COMPONENT INTEGRATION TESTS =====

describe('ExecutiveSummary logic', () => {
  it('generates AI summary for high percentage', async () => {
    const { default: ExecutiveSummary } = await import('../components/ExecutiveSummary')
    const { render, screen } = await import('@testing-library/react')

    render(
      <ExecutiveSummary
        result={{ percentage: 90, level: 'مرجح بشدة', color: 'red' }}
        statistical={{ ttr: 0.3, sentence_length_cv: 0.2, repetitive_openers_ratio: 0.2, connector_density: 2.5, error_ratio: 0.001, burstiness: 0.15, statistical_score: 0.8 }}
        ml={{ label: 'AI', confidence: 0.95, ml_score: 0.95 }}
        metadata={{ word_count: 200, sentence_count: 15, analysis_time_ms: 300 }}
      />
    )

    expect(screen.getByText(/يشير التحليل بقوة/)).toBeInTheDocument()
  })

  it('generates human summary for low percentage', async () => {
    const { default: ExecutiveSummary } = await import('../components/ExecutiveSummary')
    const { render, screen } = await import('@testing-library/react')

    render(
      <ExecutiveSummary
        result={{ percentage: 15, level: 'بشري', color: 'green' }}
        statistical={{ ttr: 0.6, sentence_length_cv: 0.5, repetitive_openers_ratio: 0.02, connector_density: 0.5, error_ratio: 0.03, burstiness: 0.5, statistical_score: 0.2 }}
        ml={{ label: 'HUMAN', confidence: 0.9, ml_score: 0.1 }}
        metadata={{ word_count: 150, sentence_count: 12, analysis_time_ms: 250 }}
      />
    )

    expect(screen.getByText(/خصائص بشرية واضحة/)).toBeInTheDocument()
  })
})

describe('FloatingToolbar', () => {
  it('renders when hasText is true', async () => {
    const { default: FloatingToolbar } = await import('../components/FloatingToolbar')
    const { render, screen } = await import('@testing-library/react')

    render(
      <FloatingToolbar
        onPaste={() => {}}
        onClear={() => {}}
        onSubmit={() => {}}
        canSubmit={true}
        hasText={true}
        loading={false}
      />
    )

    expect(screen.getByTitle('مسح النص')).toBeInTheDocument()
    expect(screen.getByText('تحقق')).toBeInTheDocument()
  })

  it('does not render when no text', async () => {
    const { default: FloatingToolbar } = await import('../components/FloatingToolbar')
    const { render, container } = await import('@testing-library/react')

    const { container: c } = render(
      <FloatingToolbar
        onPaste={() => {}}
        onClear={() => {}}
        onSubmit={() => {}}
        canSubmit={false}
        hasText={false}
        loading={false}
      />
    )

    expect(c.innerHTML).toBe('')
  })
})

describe('ConfidenceRing', () => {
  it('renders with correct percentage', async () => {
    const { default: ConfidenceRing } = await import('../components/ConfidenceRing')
    const { render, screen } = await import('@testing-library/react')

    render(<ConfidenceRing confidence={0.85} label="AI" />)
    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(screen.getByText('ذكاء اصطناعي')).toBeInTheDocument()
  })

  it('shows human label for non-AI', async () => {
    const { default: ConfidenceRing } = await import('../components/ConfidenceRing')
    const { render, screen } = await import('@testing-library/react')

    render(<ConfidenceRing confidence={0.92} label="HUMAN" />)
    expect(screen.getByText('92%')).toBeInTheDocument()
    expect(screen.getByText('بشري')).toBeInTheDocument()
  })
})

describe('WordCounter', () => {
  it('renders without crashing', async () => {
    const { default: WordCounter } = await import('../components/WordCounter')
    const { render, screen } = await import('@testing-library/react')

    render(<WordCounter onClose={() => {}} />)
    expect(screen.getByText('حاسبة النص')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/الصق أو اكتب/)).toBeInTheDocument()
  })
})

describe('QuoteExtractor', () => {
  it('returns null for too few sentences', async () => {
    const { default: QuoteExtractor } = await import('../components/QuoteExtractor')
    const { render, container } = await import('@testing-library/react')

    const { container: c } = render(<QuoteExtractor sentences={[{ text: 'جملة قصيرة', score: 0.1 }]} />)
    expect(c.innerHTML).toBe('')
  })

  it('renders top human sentences', async () => {
    const { default: QuoteExtractor } = await import('../components/QuoteExtractor')
    const { render, screen } = await import('@testing-library/react')

    const sentences = [
      { text: 'هذه جملة بشرية طويلة بما يكفي لتظهر في النتائج', score: 0.1 },
      { text: 'جملة أخرى بشرية تبدو طبيعية جداً في أسلوبها ومفرداتها', score: 0.15 },
      { text: 'جملة ثالثة تكمل السياق بشكل مناسب وطبيعي جداً', score: 0.2 },
      { text: 'هذه جملة ذكاء اصطناعي مشبوهة جداً في أسلوبها التكراري', score: 0.9 },
    ]

    render(<QuoteExtractor sentences={sentences} />)
    expect(screen.getByText('أكثر الجمل بشريةً')).toBeInTheDocument()
  })
})

describe('PastePreview', () => {
  it('returns null for short text', async () => {
    const { default: PastePreview } = await import('../components/PastePreview')
    const { render } = await import('@testing-library/react')

    const { container } = render(<PastePreview text="قصير" />)
    expect(container.innerHTML).toBe('')
  })

  it('shows stats for adequate text', async () => {
    const { default: PastePreview } = await import('../components/PastePreview')
    const { render, screen } = await import('@testing-library/react')

    const text = 'هذا نص عربي طويل يحتوي على عدة كلمات وجمل مختلفة لاختبار المعاينة السريعة للنص المدخل'
    render(<PastePreview text={text} />)
    expect(screen.getByText('معاينة سريعة')).toBeInTheDocument()
  })
})

describe('LanguageDetector', () => {
  it('returns null for Arabic text', async () => {
    const { default: LanguageDetector } = await import('../components/LanguageDetector')
    const { render } = await import('@testing-library/react')

    const { container } = render(<LanguageDetector text="هذا نص عربي خالص بالكامل ولا يحتوي على أي كلمات أجنبية" />)
    expect(container.innerHTML).toBe('')
  })

  it('warns for non-Arabic text', async () => {
    const { default: LanguageDetector } = await import('../components/LanguageDetector')
    const { render, screen } = await import('@testing-library/react')

    render(<LanguageDetector text="This is completely English text with no Arabic characters at all and it should trigger a warning" />)
    expect(screen.getByText('النص ليس عربياً')).toBeInTheDocument()
  })
})

describe('SampleTexts', () => {
  it('renders two sample buttons', async () => {
    const { default: SampleTexts } = await import('../components/SampleTexts')
    const { render, screen } = await import('@testing-library/react')

    render(<SampleTexts onSelect={() => {}} />)
    expect(screen.getByText('نص بشري')).toBeInTheDocument()
    expect(screen.getByText('نص ذكاء اصطناعي')).toBeInTheDocument()
  })
})

describe('ModelDetection', () => {
  it('returns null for human text', async () => {
    const { default: ModelDetection } = await import('../components/ModelDetection')
    const { render } = await import('@testing-library/react')

    const { container } = render(
      <ModelDetection
        text="نص بشري عادي"
        statistical={{ ttr: 0.6, connector_density: 0.5 }}
        ml={{ label: 'HUMAN', confidence: 0.9 }}
      />
    )
    expect(container.innerHTML).toBe('')
  })
})
