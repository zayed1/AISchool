// #4 — Paste preview with instant stats
import { useMemo } from 'react'

function PastePreview({ text }) {
  const stats = useMemo(() => {
    if (!text.trim()) return null
    const words = text.trim().split(/\s+/)
    const sentences = text.split(/[.!?\u061F\u0964\u06D4]+/).filter((s) => s.trim())
    const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length
    const totalChars = text.replace(/\s/g, '').length
    const arabicRatio = totalChars > 0 ? Math.round((arabicChars / totalChars) * 100) : 0
    const avgWordLen = words.length > 0 ? (text.replace(/\s/g, '').length / words.length).toFixed(1) : 0

    return {
      words: words.length,
      sentences: sentences.length,
      chars: totalChars,
      arabicRatio,
      avgWordLen,
    }
  }, [text])

  if (!stats || stats.words < 5) return null

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">معاينة سريعة</span>
      </div>
      <div className="grid grid-cols-5 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{stats.words}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">كلمة</p>
        </div>
        <div>
          <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{stats.sentences}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">جملة</p>
        </div>
        <div>
          <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{stats.chars}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">حرف</p>
        </div>
        <div>
          <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{stats.avgWordLen}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">م. الكلمة</p>
        </div>
        <div>
          <p className={`text-lg font-bold ${stats.arabicRatio >= 70 ? 'text-green-600 dark:text-green-400' : 'text-amber-500'}`}>{stats.arabicRatio}%</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">عربي</p>
        </div>
      </div>
    </div>
  )
}

export default PastePreview
