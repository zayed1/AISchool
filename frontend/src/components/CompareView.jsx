// #42 — Enhanced Compare View with side-by-side diff visualization
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
    // #42 — Determine which text is more "human"
    const sortedByHuman = results
      .slice(0, textCount)
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r)
      .sort((a, b) => a.r.result.percentage - b.r.result.percentage)
    const mostHumanIdx = sortedByHuman[0]?.i

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 text-center">نتائج المقارنة</h2>

        {/* #42 — Quick verdict banner */}
        {activeResults.length >= 2 && (
          <div className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center" role="status">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              النص <span className={`font-bold ${textColors[mostHumanIdx]}`}>«{labels[mostHumanIdx]}»</span> هو الأكثر بشرية
              <span className="mx-2 text-slate-400">—</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{results[mostHumanIdx].result.percentage}%</span> احتمال AI
            </p>
          </div>
        )}

        {/* Result cards */}
        <div className={`grid grid-cols-1 ${textCount === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
          {results.slice(0, textCount).map((r, i) =>
            r ? (
              <div key={i} className={`space-y-3 ${i === mostHumanIdx ? 'ring-2 ring-green-400 dark:ring-green-600 rounded-2xl p-2 -m-2' : ''}`}>
                <div className="flex items-center gap-2 justify-center">
                  <span className={`w-3 h-3 rounded-full ${colors[i]}`} />
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">النص {labels[i]}</span>
                  {i === mostHumanIdx && (
                    <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">الأكثر بشرية</span>
                  )}
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

        {/* #42 — Side-by-side indicator diff bars */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">مقارنة المؤشرات</h3>
          <div className="space-y-4">
            {INDICATOR_META.map((ind) => {
              const values = results.slice(0, textCount).map((r) =>
                r ? Math.min(Math.round((r.statistical[ind.key] / ind.max) * 100), 100) : 0
              )
              return (
                <div key={ind.key}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{ind.label}</span>
                    <div className="flex gap-3">
                      {values.slice(0, textCount).map((v, i) => (
                        <span key={i} className={`text-xs font-bold ${textColors[i]}`}>{v}%</span>
                      ))}
                    </div>
                  </div>
                  {/* Stacked diff bars */}
                  <div className="space-y-1">
                    {values.slice(0, textCount).map((v, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${colors[i]} shrink-0`} />
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colors[i]} transition-all duration-700`}
                            style={{ width: `${v}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Final scores comparison */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-center gap-6">
              {results.slice(0, textCount).map((r, i) =>
                r ? (
                  <div key={i} className="text-center">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${colors[i]}`} />
                      <span className="text-xs text-slate-500">{labels[i]}</span>
                    </div>
                    <span className={`text-2xl font-bold ${textColors[i]}`}>{r.result.percentage}%</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{r.result.level}</p>
                  </div>
                ) : null
              )}
            </div>
          </div>
        </div>

        {/* Radar overlay */}
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
