// #10 — Compare share: encode two results into a shareable comparison link
import { useState } from 'react'

function CompareShare() {
  const [results, setResults] = useState([])
  const [link, setLink] = useState('')

  // Load from history
  const loadHistory = () => {
    try {
      const history = JSON.parse(localStorage.getItem('analysis_history') || '[]')
      return history.slice(0, 20)
    } catch { return [] }
  }

  const history = loadHistory()

  const toggleSelect = (item, index) => {
    const exists = results.find((r) => r._idx === index)
    if (exists) {
      setResults(results.filter((r) => r._idx !== index))
    } else if (results.length < 2) {
      setResults([...results, { ...item, _idx: index }])
    }
  }

  const generateLink = () => {
    if (results.length !== 2) return
    try {
      const data = results.map((r) => ({
        p: r.result?.percentage || 0,
        l: r.result?.level || '',
        c: r.result?.color || '',
        w: r.metadata?.word_count || 0,
        ml: r.ml?.label || '',
        ss: r.statistical?.statistical_score || 0,
        ms: r.ml?.ml_score || 0,
        d: r.date || '',
      }))
      const encoded = btoa(encodeURIComponent(JSON.stringify({ cmp: data })))
      const url = `${window.location.origin}${window.location.pathname}?compare=${encoded}`
      setLink(url)
      navigator.clipboard.writeText(url).catch(() => {})
    } catch {}
  }

  const colorDot = { red: 'bg-red-400', orange: 'bg-orange-400', yellow: 'bg-yellow-400', lightgreen: 'bg-emerald-400', green: 'bg-green-400' }

  if (history.length < 2) {
    return (
      <div className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">
        أجرِ تحليلين على الأقل لاستخدام المقارنة
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        مشاركة مقارنة (اختر تحليلين)
      </h3>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {history.map((item, i) => {
          const selected = results.find((r) => r._idx === i)
          return (
            <button
              key={i}
              onClick={() => toggleSelect(item, i)}
              disabled={results.length >= 2 && !selected}
              className={`w-full flex items-center gap-3 p-2 rounded-lg text-right text-sm transition-all ${
                selected
                  ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-300 dark:border-primary-700'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700 border border-transparent'
              } ${results.length >= 2 && !selected ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorDot[item.result?.color] || 'bg-slate-300'}`} />
              <span className="flex-1 text-slate-600 dark:text-slate-400 truncate">{item.result?.percentage || 0}% — {item.result?.level || ''}</span>
              <span className="text-[10px] text-slate-400">{item.date || ''}</span>
              {selected && <svg className="w-4 h-4 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
            </button>
          )
        })}
      </div>

      <button
        onClick={generateLink}
        disabled={results.length !== 2}
        className="mt-3 w-full py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
      >
        إنشاء رابط مقارنة
      </button>

      {link && (
        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800 text-xs text-green-700 dark:text-green-400 text-center break-all" dir="ltr">
          تم نسخ الرابط! {link.slice(0, 60)}...
        </div>
      )}
    </div>
  )
}

export default CompareShare
