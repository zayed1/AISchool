// #7 — Compare two texts side by side
import { useState } from 'react'
import TextInput from './TextInput'
import ResultCard from './ResultCard'
import { analyzeText } from '../services/api'

function CompareView({ onBack }) {
  const [textA, setTextA] = useState('')
  const [textB, setTextB] = useState('')
  const [resultA, setResultA] = useState(null)
  const [resultB, setResultB] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const wordCountA = textA.trim() ? textA.trim().split(/\s+/).length : 0
  const wordCountB = textB.trim() ? textB.trim().split(/\s+/).length : 0
  const canSubmit =
    wordCountA >= 50 && wordCountA <= 5000 && wordCountB >= 50 && wordCountB <= 5000

  const handleCompare = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError('')

    try {
      const [dataA, dataB] = await Promise.all([analyzeText(textA), analyzeText(textB)])
      setResultA(dataA)
      setResultB(dataB)
    } catch (err) {
      setError('حدث خطأ أثناء التحليل. يرجى المحاولة مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResultA(null)
    setResultB(null)
    setTextA('')
    setTextB('')
  }

  if (resultA && resultB) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 text-center">نتائج المقارنة</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400">النص الأول</p>
            <ResultCard result={resultA.result} />
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">عدد الكلمات</p>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{resultA.metadata.word_count}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">النموذج</p>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                resultA.ml.label.toUpperCase() === 'AI' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                {resultA.ml.label.toUpperCase() === 'AI' ? 'ذكاء اصطناعي' : 'بشري'} ({Math.round(resultA.ml.confidence * 100)}%)
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400">النص الثاني</p>
            <ResultCard result={resultB.result} />
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">عدد الكلمات</p>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{resultB.metadata.word_count}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">النموذج</p>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                resultB.ml.label.toUpperCase() === 'AI' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                {resultB.ml.label.toUpperCase() === 'AI' ? 'ذكاء اصطناعي' : 'بشري'} ({Math.round(resultB.ml.confidence * 100)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Indicator comparison table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 overflow-x-auto">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">مقارنة المؤشرات</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400 border-b dark:border-slate-700">
                <th className="text-right py-2">المؤشر</th>
                <th className="py-2">النص الأول</th>
                <th className="py-2">النص الثاني</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'تنوع المفردات', key: 'ttr', max: 1 },
                { label: 'تباين الجمل', key: 'sentence_length_cv', max: 1 },
                { label: 'تكرار الافتتاحيات', key: 'repetitive_openers_ratio', max: 0.5 },
                { label: 'كثافة الربط', key: 'connector_density', max: 4 },
                { label: 'نسبة الأخطاء', key: 'error_ratio', max: 0.05 },
                { label: 'الانفجارية', key: 'burstiness', max: 1 },
              ].map((ind) => {
                const pA = Math.min(Math.round((resultA.statistical[ind.key] / ind.max) * 100), 100)
                const pB = Math.min(Math.round((resultB.statistical[ind.key] / ind.max) * 100), 100)
                return (
                  <tr key={ind.key} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="py-2 font-medium text-slate-700 dark:text-slate-300">{ind.label}</td>
                    <td className="py-2 text-center">{pA}%</td>
                    <td className="py-2 text-center">{pB}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3">
          <button onClick={handleReset} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors border border-slate-200 dark:border-slate-600">
            مقارنة جديدة
          </button>
          <button onClick={onBack} className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors">
            الرجوع
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">مقارنة نصين</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">الصق نصين عربيين لمقارنة نتائج التحليل جنباً إلى جنب</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">النص الأول</p>
          <TextInput value={textA} onChange={setTextA} wordCount={wordCountA} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">النص الثاني</p>
          <TextInput value={textB} onChange={setTextB} wordCount={wordCountB} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleCompare}
          disabled={!canSubmit || loading}
          className="flex-1 py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-xl transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              جارٍ المقارنة...
            </span>
          ) : 'قارن الآن'}
        </button>
        <button onClick={onBack} className="px-6 py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors border border-slate-200 dark:border-slate-600">
          الرجوع
        </button>
      </div>
    </div>
  )
}

export default CompareView
