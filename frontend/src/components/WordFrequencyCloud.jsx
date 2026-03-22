// Word frequency cloud — top repeated words displayed as tags
import { useMemo } from 'react'

function WordFrequencyCloud({ sentences }) {
  const wordData = useMemo(() => {
    if (!sentences || sentences.length === 0) return []

    const freq = {}
    const stopWords = new Set(['من', 'في', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك', 'التي', 'الذي', 'التي', 'هو', 'هي', 'أن', 'لا', 'ما', 'قد', 'كان', 'كانت', 'بين', 'أو', 'ثم', 'حتى', 'لم', 'لن', 'عند', 'كل', 'بعد', 'قبل', 'منذ', 'خلال', 'ذات', 'تم', 'يتم', 'وقد', 'كما', 'ولا', 'بل', 'لقد'])

    sentences.forEach((s) => {
      const words = s.text.replace(/[^\u0600-\u06FF\s]/g, '').split(/\s+/)
      words.forEach((w) => {
        if (w.length < 3 || stopWords.has(w)) return
        freq[w] = (freq[w] || 0) + 1
      })
    })

    return Object.entries(freq)
      .filter(([_, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([word, count]) => ({ word, count }))
  }, [sentences])

  if (wordData.length === 0) return null

  const maxCount = wordData[0]?.count || 1

  const sizeMap = (count) => {
    const ratio = count / maxCount
    if (ratio >= 0.8) return 'text-lg font-bold'
    if (ratio >= 0.5) return 'text-base font-semibold'
    if (ratio >= 0.3) return 'text-sm font-medium'
    return 'text-xs'
  }

  const colorMap = (count) => {
    const ratio = count / maxCount
    if (ratio >= 0.8) return 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 border-primary-200 dark:border-primary-800'
    if (ratio >= 0.5) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800'
    if (ratio >= 0.3) return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
    return 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        الكلمات الأكثر تكراراً
      </h3>

      <div className="flex flex-wrap gap-2 justify-center">
        {wordData.map(({ word, count }) => (
          <span
            key={word}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-transform hover:scale-105 ${sizeMap(count)} ${colorMap(count)}`}
            title={`${count} مرة`}
          >
            {word}
            <span className="text-[10px] opacity-60">×{count}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export default WordFrequencyCloud
