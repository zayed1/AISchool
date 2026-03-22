import { useState, useCallback, useMemo, useRef } from 'react'
import TextInput from '../components/TextInput'
import ProgressSteps from '../components/ProgressSteps'
import SkeletonReport from '../components/SkeletonReport'
import HistoryPanel, { saveToHistory } from '../components/HistoryPanel'
import PastePreview from '../components/PastePreview'
import LanguageDetector from '../components/LanguageDetector'
import SampleTexts from '../components/SampleTexts'
import { analyzeTextSSE } from '../services/api'
import { getCachedResult, setCachedResult } from '../utils/cache'
import { useKeyboardShortcuts, useOnlineStatus } from '../hooks/useUtilities'
import { useToast } from '../contexts/ToastContext'
import { countWords } from '../utils/debounce'
import { getRateLimitInfo, recordAnalysis, canAnalyze } from '../utils/rateLimit'
import { isBot, isTooFast } from '../utils/honeypot'

function Home({ onResult }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(null)
  const [urlInput, setUrlInput] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const isOnline = useOnlineStatus()
  const { addToast } = useToast()
  const pageLoadTime = useRef(Date.now())

  const wordCount = useMemo(() => countWords(text), [text])
  const canSubmit = wordCount >= 50 && wordCount <= 5000
  const rateInfo = getRateLimitInfo()

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || loading) return

    // #16 — Spam protection
    if (isBot(honeypot)) return
    if (isTooFast(pageLoadTime.current, 2000)) {
      addToast('يرجى الانتظار قليلاً قبل التحليل', 'warning')
      return
    }

    // #13 — Rate limit check
    if (!canAnalyze()) {
      const info = getRateLimitInfo()
      addToast(`تم تجاوز الحد الأقصى (${info.total} تحليل/ساعة). حاول بعد ${info.nextReset} دقيقة.`, 'warning', 5000)
      return
    }

    setLoading(true)
    setError('')

    try {
      // Check cache first
      const cached = await getCachedResult(text)
      if (cached) {
        cached._fromCache = true
        addToast('تم تحميل النتيجة من الذاكرة المؤقتة', 'info')
        onResult(cached)
        setLoading(false)
        return
      }

      const data = await analyzeTextSSE(text, setStep)
      await setCachedResult(text, data)
      saveToHistory(data, text)
      recordAnalysis()
      setStep(null)
      addToast('تم التحليل بنجاح!', 'success')
      onResult(data)
    } catch (err) {
      setStep(null)
      const message = err.response?.data?.detail
      if (Array.isArray(message)) {
        setError(message[0]?.msg || 'حدث خطأ أثناء التحليل')
      } else {
        setError(message || 'حدث خطأ أثناء التحليل. يرجى المحاولة مرة أخرى.')
      }
      addToast('فشل التحليل', 'error')
    } finally {
      setLoading(false)
    }
  }, [canSubmit, loading, text, onResult, honeypot, addToast])

  const handlePasteAnalyze = useCallback(async () => {
    try {
      const clipText = await navigator.clipboard.readText()
      if (clipText) {
        setText(clipText)
        const wc = countWords(clipText)
        if (wc >= 50 && wc <= 5000) {
          setTimeout(() => document.querySelector('[data-submit-btn]')?.click(), 100)
        }
      }
    } catch {}
  }, [])

  useKeyboardShortcuts({ onSubmit: handleSubmit, onPasteAnalyze: handlePasteAnalyze })

  const handleUrlAnalyze = async () => {
    if (!urlInput.trim()) return
    setUrlLoading(true)
    setError('')
    try {
      const { fetchUrlContent } = await import('../services/api')
      const extractedText = await fetchUrlContent(urlInput.trim())
      setText(extractedText)
      setUrlInput('')
      addToast('تم استخراج النص من الرابط', 'success')
    } catch {
      setError('تعذر استخراج النص من الرابط. تأكد من صحة الرابط وحاول مرة أخرى.')
    } finally {
      setUrlLoading(false)
    }
  }

  const handleHistorySelect = (item) => onResult(item)

  return (
    <div className="space-y-5">
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

          {/* #4 — Paste preview */}
          <PastePreview text={text} />

          {/* #8 — Language detection */}
          <LanguageDetector text={text} />

          {/* URL input */}
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

          {/* #16 — Honeypot (hidden from humans) */}
          <input
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }}
            aria-hidden="true"
          />

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

          {/* Submit button with rate limit info */}
          <div className="space-y-1.5">
            <button
              data-submit-btn
              onClick={handleSubmit}
              disabled={!canSubmit || loading || !isOnline || rateInfo.remaining <= 0}
              className="w-full py-4 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-xl transition-all transform active:scale-[0.99]"
              aria-label="بدء التحليل"
            >
              تحقق الآن
            </button>

            {/* #13 — Rate limit indicator */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <span>{rateInfo.remaining}/{rateInfo.total} تحليل متبقي</span>
              {rateInfo.remaining < 5 && rateInfo.remaining > 0 && (
                <span className="text-amber-500">({rateInfo.nextReset} دقيقة للتجديد)</span>
              )}
              {rateInfo.remaining <= 0 && (
                <span className="text-red-500">حاول بعد {rateInfo.nextReset} دقيقة</span>
              )}
            </div>
          </div>

          {/* #19 — Sample texts */}
          <SampleTexts onSelect={setText} />

          <HistoryPanel onSelect={handleHistorySelect} />
        </>
      )}
    </div>
  )
}

export default Home
