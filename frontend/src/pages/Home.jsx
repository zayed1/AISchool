import { useState, useCallback, useMemo } from 'react'
import TextInput from '../components/TextInput'
import ProgressSteps from '../components/ProgressSteps'
import SkeletonReport from '../components/SkeletonReport'
import HistoryPanel, { saveToHistory } from '../components/HistoryPanel'
import { analyzeTextSSE } from '../services/api'
import { getCachedResult, setCachedResult } from '../utils/cache'
import { useKeyboardShortcuts, useOnlineStatus } from '../hooks/useUtilities'
import { countWords } from '../utils/debounce'

function Home({ onResult }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(null)
  const [urlInput, setUrlInput] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)
  const isOnline = useOnlineStatus()

  const wordCount = useMemo(() => countWords(text), [text])
  const canSubmit = wordCount >= 50 && wordCount <= 5000

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || loading) return
    setLoading(true)
    setError('')

    try {
      // #1 — Check cache first
      const cached = await getCachedResult(text)
      if (cached) {
        cached._fromCache = true
        onResult(cached)
        setLoading(false)
        return
      }

      // #8 — SSE-based progress
      const data = await analyzeTextSSE(text, setStep)
      // #1 — Cache result
      await setCachedResult(text, data)
      // Save to history
      saveToHistory(data, text)
      setStep(null)
      onResult(data)
    } catch (err) {
      setStep(null)
      const message = err.response?.data?.detail
      if (Array.isArray(message)) {
        setError(message[0]?.msg || 'حدث خطأ أثناء التحليل')
      } else {
        setError(message || 'حدث خطأ أثناء التحليل. يرجى المحاولة مرة أخرى.')
      }
    } finally {
      setLoading(false)
    }
  }, [canSubmit, loading, text, onResult])

  // #6 — Keyboard shortcuts
  const handlePasteAnalyze = useCallback(async () => {
    try {
      const clipText = await navigator.clipboard.readText()
      if (clipText) {
        setText(clipText)
        // Auto-submit after paste if long enough
        const wc = countWords(clipText)
        if (wc >= 50 && wc <= 5000) {
          setTimeout(() => {
            document.querySelector('[data-submit-btn]')?.click()
          }, 100)
        }
      }
    } catch {}
  }, [])

  useKeyboardShortcuts({
    onSubmit: handleSubmit,
    onPasteAnalyze: handlePasteAnalyze,
  })

  // #16 — URL analysis
  const handleUrlAnalyze = async () => {
    if (!urlInput.trim()) return
    setUrlLoading(true)
    setError('')
    try {
      const { fetchUrlContent } = await import('../services/api')
      const extractedText = await fetchUrlContent(urlInput.trim())
      setText(extractedText)
      setUrlInput('')
    } catch {
      setError('تعذر استخراج النص من الرابط. تأكد من صحة الرابط وحاول مرة أخرى.')
    } finally {
      setUrlLoading(false)
    }
  }

  const handleHistorySelect = (item) => onResult(item)

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">تحقق من النص</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">الصق النص العربي المراد فحصه وسنحلله لك باستخدام الذكاء الاصطناعي والتحليل الإحصائي</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {step && <ProgressSteps currentStep={step} />}
          <SkeletonReport />
        </div>
      ) : (
        <>
          <TextInput value={text} onChange={setText} wordCount={wordCount} />

          {/* #16 — URL input */}
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="أو الصق رابط مقال لاستخراج النص..."
              className="flex-1 px-4 py-2.5 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 outline-none focus:border-primary-500 transition-colors"
              dir="ltr"
              aria-label="رابط مقال لاستخراج النص"
            />
            <button
              onClick={handleUrlAnalyze}
              disabled={!urlInput.trim() || urlLoading}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors border border-slate-200 dark:border-slate-600 shrink-0"
            >
              {urlLoading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : 'استخراج'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-3 text-sm flex items-center gap-2" role="alert">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {!isOnline && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-lg p-3 text-sm" role="alert">
              لا يوجد اتصال بالإنترنت — التحليل غير متاح حالياً
            </div>
          )}

          <button
            data-submit-btn
            onClick={handleSubmit}
            disabled={!canSubmit || loading || !isOnline}
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-xl transition-all transform active:scale-[0.99]"
            aria-label="بدء التحليل"
          >
            تحقق الآن
          </button>

          <HistoryPanel onSelect={handleHistorySelect} />
        </>
      )}
    </div>
  )
}

export default Home
