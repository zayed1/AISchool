import { useState } from 'react'
import TextInput from '../components/TextInput'
import { analyzeText } from '../services/api'

function Home({ onResult }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const canSubmit = wordCount >= 50 && wordCount <= 5000

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      const data = await analyzeText(text)
      onResult(data)
    } catch (err) {
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

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-800">تحقق من النص</h2>
        <p className="text-slate-500">الصق النص العربي المراد فحصه وسنحلله لك</p>
      </div>

      <TextInput value={text} onChange={setText} wordCount={wordCount} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || loading}
        className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-xl transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            جارٍ التحليل...
          </span>
        ) : (
          'تحقق الآن'
        )}
      </button>
    </div>
  )
}

export default Home
