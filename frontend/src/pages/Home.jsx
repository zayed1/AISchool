import { useState } from 'react'
import TextInput from '../components/TextInput'
import ProgressSteps from '../components/ProgressSteps'
import SkeletonReport from '../components/SkeletonReport'
import HistoryPanel, { saveToHistory } from '../components/HistoryPanel'
import { analyzeText } from '../services/api'

function Home({ onResult }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(null)

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const canSubmit = wordCount >= 50 && wordCount <= 5000

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError('')
    setStep('statistical')

    // Simulate progress steps while waiting for API
    const stepTimer1 = setTimeout(() => setStep('ml'), 800)
    const stepTimer2 = setTimeout(() => setStep('combining'), 2000)

    try {
      const data = await analyzeText(text)
      // #8 — Save to local history
      saveToHistory(data, text)
      clearTimeout(stepTimer1)
      clearTimeout(stepTimer2)
      setStep(null)
      onResult(data)
    } catch (err) {
      clearTimeout(stepTimer1)
      clearTimeout(stepTimer2)
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
  }

  // #8 — Select from history
  const handleHistorySelect = (item) => {
    onResult(item)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">تحقق من النص</h2>
        <p className="text-slate-500 text-sm sm:text-base">الصق النص العربي المراد فحصه وسنحلله لك باستخدام الذكاء الاصطناعي والتحليل الإحصائي</p>
      </div>

      {/* Loading state with skeleton + progress */}
      {loading ? (
        <div className="space-y-4">
          {/* #11 — Progress steps indicator */}
          {step && <ProgressSteps currentStep={step} />}
          {/* #1 — Skeleton loading */}
          <SkeletonReport />
        </div>
      ) : (
        <>
          <TextInput value={text} onChange={setText} wordCount={wordCount} />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* #10 — Larger touch target on mobile */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="w-full py-4 sm:py-4 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-xl transition-all transform active:scale-[0.99]"
          >
            تحقق الآن
          </button>

          {/* #8 — History panel */}
          <HistoryPanel onSelect={handleHistorySelect} />
        </>
      )}
    </div>
  )
}

export default Home
