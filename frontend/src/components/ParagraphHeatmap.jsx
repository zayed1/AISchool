// #1 — Paragraph heatmap: overlay colors on original text by AI score
import { useState } from 'react'

function ParagraphHeatmap({ sentences }) {
  const [expanded, setExpanded] = useState(false)

  if (!sentences || sentences.length < 2) return null

  // #20 — Smart paragraph splitting: respect natural breaks
  const paragraphs = []
  let currentChunk = []
  for (let i = 0; i < sentences.length; i++) {
    currentChunk.push(sentences[i])
    const hasBreak = sentences[i].text.includes('\n') || sentences[i].text.endsWith('.')
    const isLong = currentChunk.length >= 3
    const isVeryLong = currentChunk.length >= 5
    const isLast = i === sentences.length - 1
    if (isLast || isVeryLong || (isLong && hasBreak)) {
      const avgScore = currentChunk.reduce((s, c) => s + c.score, 0) / currentChunk.length
      paragraphs.push({ sentences: [...currentChunk], avgScore })
      currentChunk = []
    }
  }

  const getColor = (score) => {
    if (score >= 0.7) return 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800'
    if (score >= 0.5) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
    if (score >= 0.35) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
  }

  const getLabel = (score) => {
    if (score >= 0.7) return { text: 'AI مرجح', color: 'text-red-600 dark:text-red-400' }
    if (score >= 0.5) return { text: 'مشبوه', color: 'text-orange-600 dark:text-orange-400' }
    if (score >= 0.35) return { text: 'غير واضح', color: 'text-yellow-600 dark:text-yellow-400' }
    return { text: 'بشري', color: 'text-green-600 dark:text-green-400' }
  }

  const shown = expanded ? paragraphs : paragraphs.slice(0, 4)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        خريطة حرارية للفقرات
      </h3>

      <div className="space-y-3">
        {shown.map((p, i) => {
          const label = getLabel(p.avgScore)
          return (
            <div key={i} className={`rounded-lg border p-3 transition-all ${getColor(p.avgScore)}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-slate-400 dark:text-slate-500">فقرة {i + 1}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${label.color}`}>{label.text}</span>
                  <span className="text-[10px] text-slate-400">{Math.round(p.avgScore * 100)}%</span>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300" dir="rtl">
                {p.sentences.map((s, j) => (
                  <span key={j}>
                    <span
                      className="transition-colors"
                      style={{
                        borderBottom: `2px solid ${s.score >= 0.6 ? 'rgba(239,68,68,0.5)' : s.score >= 0.4 ? 'rgba(234,179,8,0.4)' : 'rgba(34,197,94,0.3)'}`,
                      }}
                    >
                      {s.text}
                    </span>
                    {j < p.sentences.length - 1 && '. '}
                  </span>
                ))}
              </p>
            </div>
          )
        })}
      </div>

      {paragraphs.length > 4 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full text-sm text-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center gap-1"
        >
          <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {expanded ? 'عرض أقل' : `عرض الكل (${paragraphs.length} فقرات)`}
        </button>
      )}

      <div className="flex gap-4 text-[10px] text-slate-400 mt-3 justify-center">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> AI مرجح</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" /> مشبوه</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> غير واضح</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" /> بشري</span>
      </div>
    </div>
  )
}

export default ParagraphHeatmap
