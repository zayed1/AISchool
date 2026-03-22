// Advanced Compare View — supports up to 3 texts
import { useState } from 'react'
import TextInput from './TextInput'
import ResultCard from './ResultCard'
import RadarChart from './RadarChart'
import { analyzeText } from '../services/api'
import { useToast } from '../contexts/ToastContext'

const INDICATOR_META = [
  { label: 'تنوع المفردات', key: 'ttr', max: 1 },
  { label: 'تباين الجمل', key: 'sentence_length_cv', max: 1 },
  { label: 'تكرار الافتتاحيات', key: 'repetitive_openers_ratio', max: 0.5 },
  { label: 'كثافة الربط', key: 'connector_density', max: 4 },
  { label: 'نسبة الأخطاء', key: 'error_ratio', max: 0.05 },
  { label: 'الانفجارية', key: 'burstiness', max: 1 },
]

function CompareView({ onBack }) {
  const [texts, setTexts] = useState(['', '', ''])
  const [results, setResults] = useState([null, null, null])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [textCount, setTextCount] = useState(2)
  const { addToast } = useToast()

  const wordCounts = texts.map((t) => (t.trim() ? t.trim().split(/\s+/).length : 0))
  const canSubmit = wordCounts.slice(0, textCount).every((w) => w >= 50 && w <= 5000)

  const updateText = (idx, val) => {
    const next = [...texts]
    next[idx] = val
    setTexts(next)
  }

  const handleCompare = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      const promises = texts.slice(0, textCount).map((t) => analyzeText(t))
      const data = await Promise.all(promises)
      const next = [null, null, null]
      data.forEach((d, i) => (next[i] = d))
      setResults(next)
      addToast('تمت المقارنة بنجاح', 'success')
    } catch {
      setError('حدث خطأ أثناء التحليل. يرجى المحاولة مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResults([null, null, null])
    setTexts(['', '', ''])
  }

  const activeResults = results.slice(0, textCount).filter(Boolean)
  const labels = ['الأول', 'الثاني', 'الثالث']
  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500']
  const textColors = ['text-blue-600', 'text-emerald-600', 'text-purple-600']

  if (activeResults.length >= 2) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 text-center">نتائج المقارنة</h2>

        {/* Result cards */}
        <div className={`grid grid-cols-1 ${textCount === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
          {results.slice(0, textCount).map((r, i) =>
            r ? (
              <div key={i} className="space-y-3">
                <div className="flex items-center gap-2 justify-center">
                  <span className={`w-3 h-3 rounded-full ${colors[i]}`} />
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">النص {labels[i]}</span>
                </div>
                <ResultCard result={r.result} />
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
                  <p className="text-xs text-slate-400">{r.metadata.word_count} كلمة</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.ml.label.toUpperCase() === 'AI' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                    {r.ml.label.toUpperCase() === 'AI' ? 'AI' : 'بشري'} ({Math.round(r.ml.confidence * 100)}%)
                  </span>
                </div>
              </div>
            ) : null
          )}
        </div>

        {/* Comparison table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 overflow-x-auto">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">مقارنة المؤشرات</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400 border-b dark:border-slate-700">
                <th className="text-right py-2">المؤشر</th>
                {results.slice(0, textCount).map((_, i) => (
                  <th key={i} className="py-2">
                    <span className="flex items-center justify-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${colors[i]}`} />
                      {labels[i]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INDICATOR_META.map((ind) => (
                <tr key={ind.key} className="border-b border-slate-100 dark:border-slate-700">
                  <td className="py-2 font-medium text-slate-700 dark:text-slate-300">{ind.label}</td>
                  {results.slice(0, textCount).map((r, i) => {
                    if (!r) return <td key={i} />
                    const pct = Math.min(Math.round((r.statistical[ind.key] / ind.max) * 100), 100)
                    return (
                      <td key={i} className="py-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${colors[i]}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs">{pct}%</span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
              {/* Final scores row */}
              <tr className="font-bold">
                <td className="py-2 text-slate-800 dark:text-slate-200">النتيجة النهائية</td>
                {results.slice(0, textCount).map((r, i) => (
                  <td key={i} className={`py-2 text-center ${textColors[i]}`}>
                    {r ? `${r.result.percentage}%` : '-'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Radar overlay for first 2 */}
        {activeResults.length >= 2 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3 text-center">مخطط الرادار المقارن</h3>
            <div className={`grid ${textCount === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
              {results.slice(0, textCount).map((r, i) =>
                r ? (
                  <div key={i}>
                    <p className="text-xs text-center text-slate-400 mb-1">النص {labels[i]}</p>
                    <RadarChart statistical={r.statistical} />
                  </div>
                ) : null
              )}
            </div>
          </div>
        )}

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
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">مقارنة النصوص</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">قارن بين نصين أو ثلاثة نصوص عربية جنباً إلى جنب</p>
      </div>

      {/* Text count toggle */}
      <div className="flex justify-center gap-2">
        <button onClick={() => setTextCount(2)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${textCount === 2 ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
          نصين
        </button>
        <button onClick={() => setTextCount(3)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${textCount === 3 ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
          ثلاثة نصوص
        </button>
      </div>

      <div className={`grid grid-cols-1 ${textCount === 3 ? 'lg:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
        {Array.from({ length: textCount }).map((_, i) => (
          <div key={i}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-3 h-3 rounded-full ${colors[i]}`} />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">النص {labels[i]}</p>
            </div>
            <TextInput value={texts[i]} onChange={(v) => updateText(i, v)} wordCount={wordCounts[i]} />
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-3 text-sm">{error}</div>
      )}

      <div className="flex gap-3">
        <button onClick={handleCompare} disabled={!canSubmit || loading} className="flex-1 py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-xl transition-colors">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
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
