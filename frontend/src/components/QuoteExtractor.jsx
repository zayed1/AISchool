// Quote extractor — finds most "human-sounding" sentences
function QuoteExtractor({ sentences }) {
  if (!sentences || sentences.length < 3) return null

  // Find sentences with lowest AI scores (most human)
  const humanSentences = [...sentences]
    .filter((s) => s.text.split(/\s+/).length >= 5)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)

  if (humanSentences.length === 0) return null

  const copyQuote = (text) => {
    navigator.clipboard.writeText(`"${text}"`).catch(() => {})
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        أكثر الجمل بشريةً
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">الجمل التي تظهر أقل سمات التوليد الآلي</p>

      <div className="space-y-3">
        {humanSentences.map((s, i) => (
          <div key={i} className="group relative bg-emerald-50 dark:bg-emerald-900/10 rounded-lg p-3 border-r-4 border-emerald-400">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 text-2xl leading-none shrink-0 mt-1">"</span>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex-1">{s.text}</p>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{Math.round((1 - s.score) * 100)}% بشري</span>
              <button
                onClick={() => copyQuote(s.text)}
                className="text-[10px] text-slate-400 hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                نسخ
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default QuoteExtractor
