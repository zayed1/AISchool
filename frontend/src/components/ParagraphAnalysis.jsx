// #5 — Paragraph-level analysis breakdown
// #20 — Smart paragraph splitting: respect original line breaks
function ParagraphAnalysis({ sentences }) {
  if (!sentences || sentences.length === 0) return null

  // #20 — Smart split: look for sentences ending with line breaks or long gaps
  const paragraphs = []
  let current = { sentences: [], startIdx: 0 }

  sentences.forEach((s, i) => {
    current.sentences.push(s)

    // Detect paragraph breaks: sentence text ends with \n, or natural break after 3-5 sentences
    const hasLineBreak = s.text.includes('\n') || s.text.endsWith('.')
    const isLongEnough = current.sentences.length >= 3
    const isVeryLong = current.sentences.length >= 5
    const isLast = i === sentences.length - 1

    // Split on natural boundaries or after accumulating enough sentences
    if (isLast || isVeryLong || (isLongEnough && hasLineBreak)) {
      paragraphs.push({ ...current })
      current = { sentences: [], startIdx: i + 1 }
    }
  })

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">تحليل الفقرات</h3>
      <div className="space-y-3">
        {paragraphs.map((para, idx) => {
          const avgScore = para.sentences.reduce((sum, s) => sum + s.score, 0) / para.sentences.length
          const percentage = Math.round(avgScore * 100)

          let barColor = 'bg-green-400'
          let textColor = 'text-green-700 dark:text-green-400'
          let bgColor = 'bg-green-50 dark:bg-green-900/10'
          if (percentage >= 65) {
            barColor = 'bg-red-400'
            textColor = 'text-red-700 dark:text-red-400'
            bgColor = 'bg-red-50 dark:bg-red-900/10'
          } else if (percentage >= 35) {
            barColor = 'bg-yellow-400'
            textColor = 'text-yellow-700 dark:text-yellow-400'
            bgColor = 'bg-yellow-50 dark:bg-yellow-900/10'
          }

          const preview = para.sentences.map((s) => s.text).join(' ')
          const truncated = preview.length > 80 ? preview.slice(0, 80) + '...' : preview

          return (
            <div key={idx} className={`rounded-lg p-3 ${bgColor} border border-slate-100 dark:border-slate-700`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  فقرة {idx + 1} ({para.sentences.length} جمل)
                </span>
                <span className={`text-sm font-bold ${textColor}`}>{percentage}%</span>
              </div>

              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full mb-2 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${percentage}%` }} />
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{truncated}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ParagraphAnalysis
