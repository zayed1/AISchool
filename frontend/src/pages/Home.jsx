import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import TextInput from '../components/TextInput'
import ProgressSteps from '../components/ProgressSteps'
import SkeletonReport from '../components/SkeletonReport'
import HistoryPanel, { saveToHistory } from '../components/HistoryPanel'
import PastePreview from '../components/PastePreview'
import LanguageDetector from '../components/LanguageDetector'
import SampleTexts from '../components/SampleTexts'
import FloatingToolbar from '../components/FloatingToolbar'
import { analyzeTextSSE } from '../services/api'
import { getCachedResult, setCachedResult } from '../utils/cache'
import { useKeyboardShortcuts, useOnlineStatus } from '../hooks/useUtilities'
import { useToast } from '../contexts/ToastContext'
import { countWords } from '../utils/debounce'
import { getRateLimitInfo, recordAnalysis, canAnalyze } from '../utils/rateLimit'
import { isBot, isTooFast } from '../utils/honeypot'
import { cleanTextForAnalysis, smartPasteClean } from '../utils/textCleaner'
import { requestNotificationPermission, sendAnalysisNotification } from '../utils/notifications'
import { saveDraft, loadDraft, clearDraft } from '../utils/draftStorage'
import ContextualTip from '../components/ContextualTip'

function Home({ onResult }) {
  // #7 — Restore draft from sessionStorage
  const [text, setText] = useState(() => {
    try {
      const privacy = localStorage.getItem('privacy_mode') === 'true'
      if (privacy) return ''
      return sessionStorage.getItem('draft_text') || ''
    } catch { return '' }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(null)
  const [urlInput, setUrlInput] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlPreview, setUrlPreview] = useState(null) // #4 — URL preview
  const [honeypot, setHoneypot] = useState('')
  const [cleaningInfo, setCleaningInfo] = useState(null)
  const [draftRecovery, setDraftRecovery] = useState(null) // #3 — IndexedDB recovery
  const [countdown, setCountdown] = useState(0) // #2 — Rate limit countdown
  const isOnline = useOnlineStatus()
  const { addToast } = useToast()
  const pageLoadTime = useRef(Date.now())
  const draftTimer = useRef(null)

  // #8 — Request notification permission
  useEffect(() => { requestNotificationPermission() }, [])

  // #3 — Load draft from IndexedDB on mount
  useEffect(() => {
    const privacy = localStorage.getItem('privacy_mode') === 'true'
    if (privacy) return
    loadDraft().then((draft) => {
      if (draft && draft.text && draft.text.length > 10 && !text) {
        setDraftRecovery(draft)
      }
    })
  }, [])

  // #7 — Auto-save draft to sessionStorage
  useEffect(() => {
    try {
      const privacy = localStorage.getItem('privacy_mode') === 'true'
      if (!privacy) sessionStorage.setItem('draft_text', text)
    } catch {}
  }, [text])

  // #3 — Auto-save draft to IndexedDB every 10s
  useEffect(() => {
    const privacy = localStorage.getItem('privacy_mode') === 'true'
    if (privacy || !text || text.length < 20) return
    if (draftTimer.current) clearTimeout(draftTimer.current)
    draftTimer.current = setTimeout(() => saveDraft(text), 10000)
    return () => { if (draftTimer.current) clearTimeout(draftTimer.current) }
  }, [text])

  // #2 — Countdown timer when rate limited
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown > 0])

  const wordCount = useMemo(() => countWords(text), [text])
  const canSubmit = wordCount >= 50 && wordCount <= 5000
  const rateInfo = getRateLimitInfo()
  const wordsNeeded = Math.max(0, 50 - wordCount)

  // #41 — Enhanced smart paste with detailed notification
  const handleTextChange = useCallback((newText) => {
    if (newText.length > text.length + 20) {
      const { text: cleaned, changes } = smartPasteClean(newText)
      const removedChars = newText.length - cleaned.length
      if (changes.length > 0 || removedChars > 5) {
        setText(cleaned)
        const details = changes.length > 0 ? changes.join('، ') : ''
        const charInfo = removedChars > 0 ? `إزالة ${removedChars} حرف` : ''
        const parts = [details, charInfo].filter(Boolean)
        addToast(`تنظيف ذكي: ${parts.join(' · ')}`, 'info', 5000)
        return
      }
    }
    setText(newText)
  }, [text, addToast])

  // #22 — Smart error messages
  const getSmartError = (err) => {
    const status = err.response?.status
    const detail = err.response?.data?.detail

    if (!navigator.onLine || err.code === 'ERR_NETWORK') {
      return 'لا يوجد اتصال بالإنترنت. تحقق من اتصالك وحاول مرة أخرى.'
    }
    if (status === 429) {
      const info = getRateLimitInfo()
      setCountdown(info.nextReset * 60)
      return `تم تجاوز الحد الأقصى للتحليلات. متاح بعد ${info.nextReset} دقيقة.`
    }
    if (status === 422) {
      if (typeof detail === 'string') {
        if (detail.includes('50')) return 'النص قصير جداً. أضف المزيد حتى يصل إلى 50 كلمة على الأقل.'
        if (detail.includes('5000')) return 'النص طويل جداً. الحد الأقصى 5000 كلمة.'
        if (detail.includes('عربي') || detail.includes('arabic')) return 'نسبة النص العربي منخفضة. تأكد من أن 30% على الأقل من النص عربي.'
        return detail
      }
      if (Array.isArray(detail)) return detail[0]?.msg || 'بيانات غير صالحة. تحقق من النص وحاول مرة أخرى.'
    }
    if (status === 500 || status === 502 || status === 503) {
      return 'الخادم غير متاح مؤقتاً. حاول مرة أخرى بعد قليل.'
    }
    if (typeof detail === 'string') return detail
    return 'حدث خطأ غير متوقع. حاول مرة أخرى أو تأكد من اتصالك بالإنترنت.'
  }

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || loading) return
    if (isBot(honeypot)) return
    if (isTooFast(pageLoadTime.current, 2000)) {
      addToast('يرجى الانتظار قليلاً قبل التحليل', 'warning')
      return
    }
    if (!canAnalyze()) {
      const info = getRateLimitInfo()
      setCountdown(info.nextReset * 60) // #2 — Start countdown
      addToast(`تم تجاوز الحد الأقصى (${info.total} تحليل/ساعة). حاول بعد ${info.nextReset} دقيقة.`, 'warning', 5000)
      return
    }

    const { text: cleanedText, changes } = cleanTextForAnalysis(text)
    if (changes.length > 0) {
      setCleaningInfo(changes)
      setText(cleanedText)
      setTimeout(() => setCleaningInfo(null), 4000)
    }

    setLoading(true)
    setError('')

    try {
      const textToAnalyze = cleanedText || text
      const cached = await getCachedResult(textToAnalyze)
      if (cached) {
        cached._fromCache = true
        addToast('تم تحميل النتيجة من الذاكرة المؤقتة', 'info')
        onResult(cached)
        setLoading(false)
        return
      }

      const data = await analyzeTextSSE(textToAnalyze, setStep)
      const privacy = localStorage.getItem('privacy_mode') === 'true'
      if (!privacy) {
        await setCachedResult(textToAnalyze, data)
        saveToHistory(data, textToAnalyze)
      }
      recordAnalysis()
      setStep(null)
      sessionStorage.removeItem('draft_text')
      clearDraft() // #3 — Clear IndexedDB draft
      addToast('تم التحليل بنجاح!', 'success')
      sendAnalysisNotification(data.result)
      onResult(data)
    } catch (err) {
      setStep(null)
      setError(getSmartError(err)) // #22 — Smart error
      addToast('فشل التحليل', 'error')
    } finally {
      setLoading(false)
    }
  }, [canSubmit, loading, text, onResult, honeypot, addToast])

  const handlePasteAnalyze = useCallback(async () => {
    try {
      const clipText = await navigator.clipboard.readText()
      if (clipText) {
        const { text: cleaned, changes } = smartPasteClean(clipText)
        setText(cleaned)
        if (changes.length > 0) addToast(`تنظيف تلقائي: ${changes.join('، ')}`, 'info', 3000)
        const wc = countWords(cleaned)
        if (wc >= 50 && wc <= 5000) {
          setTimeout(() => document.querySelector('[data-submit-btn]')?.click(), 100)
        }
      }
    } catch {}
  }, [addToast])

  useKeyboardShortcuts({ onSubmit: handleSubmit, onPasteAnalyze: handlePasteAnalyze })

  // #4 — URL preview before analysis
  const handleUrlExtract = async () => {
    if (!urlInput.trim()) return
    setUrlLoading(true)
    setError('')
    try {
      const { fetchUrlContent } = await import('../services/api')
      const extractedText = await fetchUrlContent(urlInput.trim())
      setUrlPreview(extractedText) // Show preview instead of auto-inserting
    } catch {
      setError('تعذر استخراج النص من الرابط. تأكد من صحة الرابط وحاول مرة أخرى.')
    } finally {
      setUrlLoading(false)
    }
  }

  const acceptUrlPreview = () => {
    if (urlPreview) {
      setText(urlPreview)
      setUrlPreview(null)
      setUrlInput('')
      addToast('تم إدراج النص المستخرج', 'success')
    }
  }

  // #2 — Format countdown
  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">تحقق من النص</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">الصق النص العربي المراد فحصه وسنحلله لك باستخدام الذكاء الاصطناعي والتحليل الإحصائي</p>
      </div>

      {/* #3 — Draft recovery banner */}
      {draftRecovery && !text && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <div>
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400">مسودة محفوظة</p>
              <p className="text-[10px] text-blue-500">
                {countWords(draftRecovery.text)} كلمة — منذ {Math.round((Date.now() - draftRecovery.timestamp) / 60000)} دقيقة
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setText(draftRecovery.text); setDraftRecovery(null) }} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
              استئناف
            </button>
            <button onClick={() => { setDraftRecovery(null); clearDraft() }} className="px-3 py-1 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500">
              تجاهل
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4" role="status" aria-busy="true" aria-label="جارٍ التحليل">
          {/* #61 — Live step announcements for screen readers */}
          <div className="sr-only" aria-live="assertive" aria-atomic="true">
            {step === 'statistical' && 'جارٍ التحليل الإحصائي للنص'}
            {step === 'ml' && 'جارٍ فحص النص بنموذج الذكاء الاصطناعي'}
            {step === 'combining' && 'جارٍ تجميع النتائج النهائية'}
          </div>
          {step && <ProgressSteps currentStep={step} />}
          <SkeletonReport />
        </div>
      ) : (
        <>
          <TextInput value={text} onChange={handleTextChange} wordCount={wordCount} />

          {wordCount > 0 && wordCount < 50 && (
            <div className="flex items-center justify-center gap-3 py-1">
              <div className="relative w-10 h-10">
                <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 40 40" aria-hidden="true">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="#e2e8f0" strokeWidth="3" className="dark:stroke-slate-700" />
                  <circle cx="20" cy="20" r="16" fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 16} strokeDashoffset={2 * Math.PI * 16 * (1 - wordCount / 50)}
                    style={{ transition: 'stroke-dashoffset 0.3s' }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-amber-500">{wordCount}</span>
              </div>
              <span className="text-sm text-amber-500">أضف <strong>{wordsNeeded}</strong> كلمة للوصول للحد الأدنى</span>
            </div>
          )}

          {cleaningInfo && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 rounded-lg p-2 text-xs text-center" role="status">
              تم تنظيف النص: {cleaningInfo.join(' | ')}
            </div>
          )}

          <PastePreview text={text} />
          <LanguageDetector text={text} />

          <div className="flex gap-2">
            <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="أو الصق رابط مقال لاستخراج النص..." className="flex-1 px-4 py-2.5 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-colors" dir="ltr" aria-label="رابط المقال" />
            <button onClick={handleUrlExtract} disabled={!urlInput.trim() || urlLoading} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors border border-slate-200 dark:border-slate-600 shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="استخراج النص">
              {urlLoading ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" role="status" aria-label="جارٍ الاستخراج"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : 'استخراج'}
            </button>
          </div>

          {/* #4 — URL preview modal */}
          {urlPreview && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  معاينة النص المستخرج
                </h4>
                <span className="text-[10px] text-slate-400">{countWords(urlPreview)} كلمة</span>
              </div>
              <div className="max-h-32 overflow-y-auto text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3" dir="rtl">
                {urlPreview.slice(0, 500)}{urlPreview.length > 500 ? '...' : ''}
              </div>
              <div className="flex gap-2">
                <button onClick={acceptUrlPreview} className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500">
                  استخدام هذا النص
                </button>
                <button onClick={() => setUrlPreview(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500">
                  إلغاء
                </button>
              </div>
            </div>
          )}

          <input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" style={{ display: 'none' }} aria-hidden="true" />

          {/* #7 — Error with action buttons */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-3 text-sm" role="alert">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="flex-1">{error}</span>
              </div>
              <div className="flex gap-2 mt-2 mr-6">
                <button onClick={() => { setError(''); handleSubmit() }} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/40 text-red-700 dark:text-red-400 text-xs font-medium rounded-lg transition-colors">
                  إعادة المحاولة
                </button>
                <button onClick={() => setError('')} className="px-3 py-1 text-red-500 hover:text-red-600 text-xs transition-colors">
                  إخفاء
                </button>
              </div>
            </div>
          )}

          {!isOnline && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-lg p-3 text-sm" role="alert">لا يوجد اتصال بالإنترنت</div>
          )}

          <div className="space-y-1.5">
            <button data-submit-btn onClick={handleSubmit} disabled={!canSubmit || loading || !isOnline || rateInfo.remaining <= 0} className="w-full py-4 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-xl transition-all transform active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2" aria-label="تحقق الآن">
              تحقق الآن
            </button>
            {/* #3 — Visual rate limit bar */}
            <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
              <div className="flex-1 max-w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${rateInfo.remaining <= 3 ? 'bg-red-400' : rateInfo.remaining <= 8 ? 'bg-amber-400' : 'bg-green-400'}`}
                  style={{ width: `${(rateInfo.remaining / rateInfo.total) * 100}%` }}
                />
              </div>
              <span>{rateInfo.remaining}/{rateInfo.total}</span>
              {countdown > 0 && (
                <span className="text-red-500 font-mono font-bold flex items-center gap-1">
                  <svg className="w-3 h-3 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatCountdown(countdown)}
                </span>
              )}
              {!countdown && rateInfo.remaining <= 0 && <span className="text-red-500">حاول بعد {rateInfo.nextReset} د</span>}
            </div>
          </div>

          <ContextualTip id="sample"><SampleTexts onSelect={setText} /></ContextualTip>
          <HistoryPanel onSelect={(item) => onResult(item)} />

          <FloatingToolbar onPaste={handlePasteAnalyze} onClear={() => setText('')} onSubmit={handleSubmit} canSubmit={canSubmit && isOnline && rateInfo.remaining > 0} hasText={wordCount > 0} loading={false} />
        </>
      )}
    </div>
  )
}

export default Home
