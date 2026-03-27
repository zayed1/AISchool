// Repetition detector — finds repeated/similar phrases within text
import { useState, useMemo } from 'react'

// Truncated text box with expand toggle
function TruncatedBox({ children, className }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className={`${className} relative`}>
      <div className={expanded ? '' : 'max-h-[3.5rem] overflow-hidden'}>
        {children}
      </div>
      {!expanded && (
        <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-inherit pointer-events-none" />
      )}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[10px] font-medium text-primary-500 hover:text-primary-600 dark:text-primary-400 mt-1"
      >
        {expanded ? 'تقليص' : 'عرض الكل'}
      </button>
    </div>
  )
}

function RepetitionDetector({ sentences }) {
  const analysis = useMemo(() => {
    if (!sentences || sentences.length < 4) return null

    const texts = sentences.map((s) => s.text.trim())
    const duplicates = []
    const similarPairs = []

    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 1; j < texts.length; j++) {
        const a = texts[i].replace(/[^\u0600-\u06FF\s]/g, '').trim()
        const b = texts[j].replace(/[^\u0600-\u06FF\s]/g, '').trim()
        if (a.length < 10 || b.length < 10) continue

        if (a === b) {
          duplicates.push({ i, j, text: texts[i] })
        } else {
          const wordsA = new Set(a.split(/\s+/))
          const wordsB = new Set(b.split(/\s+/))
          const intersection = [...wordsA].filter((w) => wordsB.has(w)).length
          const union = new Set([...wordsA, ...wordsB]).size
          const similarity = union > 0 ? intersection / union : 0

          if (similarity > 0.6) {
            similarPairs.push({ i, j, similarity: Math.round(similarity * 100), textA: texts[i], textB: texts[j] })
          }
        }
      }
    }

    const ngrams = {}
    texts.forEach((text, sIdx) => {
      const words = text.split(/\s+/)
      for (let k = 0; k <= words.length - 3; k++) {
        const gram = words.slice(k, k + 3).join(' ')
        if (gram.length < 8) continue
        if (!ngrams[gram]) ngrams[gram] = []
        ngrams[gram].push(sIdx)
      }
    })

    const repeatedPhrases = Object.entries(ngrams)
      .filter(([_, locs]) => locs.length >= 2)
      .map(([phrase, locs]) => ({ phrase, count: locs.length, sentences: [...new Set(locs)] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    if (duplicates.length === 0 && similarPairs.length === 0 && repeatedPhrases.length === 0) return null

    return { duplicates, similarPairs: similarPairs.slice(0, 3), repeatedPhrases }
  }, [sentences])

  if (!analysis) return null

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        كشف التكرار الداخلي
      </h3>

      {analysis.duplicates.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">جمل مكررة حرفياً ({analysis.duplicates.length})</p>
          <div className="space-y-2">
            {analysis.duplicates.map((d, i) => (
              <TruncatedBox key={i} className="bg-red-50 dark:bg-red-900/10 rounded-lg p-3 text-xs text-red-700 dark:text-red-400">
                <div className="flex items-center gap-2 mb-1">
                  <span className="shrink-0 px-1.5 py-0.5 bg-red-200 dark:bg-red-800/40 rounded text-[10px] font-bold">جملة {d.i + 1} = جملة {d.j + 1}</span>
                </div>
                <p className="leading-relaxed">{d.text}</p>
              </TruncatedBox>
            ))}
          </div>
        </div>
      )}

      {analysis.similarPairs.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">جمل متشابهة</p>
          <div className="space-y-2">
            {analysis.similarPairs.map((p, i) => (
              <TruncatedBox key={i} className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-3 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-amber-700 dark:text-amber-400 font-medium">جملة {p.i + 1} ↔ جملة {p.j + 1}</span>
                  <span className="shrink-0 px-1.5 py-0.5 bg-amber-200 dark:bg-amber-800/40 rounded text-[10px] font-bold text-amber-700 dark:text-amber-300">{p.similarity}%</span>
                </div>
                <div className="space-y-1.5">
                  <p className="text-amber-800 dark:text-amber-300 leading-relaxed border-r-2 border-amber-300 dark:border-amber-600 pr-2">{p.textA}</p>
                  <p className="text-amber-700 dark:text-amber-400 leading-relaxed border-r-2 border-amber-200 dark:border-amber-700 pr-2">{p.textB}</p>
                </div>
              </TruncatedBox>
            ))}
          </div>
        </div>
      )}

      {analysis.repeatedPhrases.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">عبارات مكررة</p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.repeatedPhrases.map((p, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-400">
                "{p.phrase}" <span className="font-bold text-primary-500">×{p.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default RepetitionDetector
