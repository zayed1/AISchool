// #4 — Detect mixed human+AI content at paragraph level
function MixedTextDetector({ sentences }) {
  if (!sentences || sentences.length < 4) return null

  // Group into paragraphs of ~3-4 sentences
  const paragraphs = []
  for (let i = 0; i < sentences.length; i += 4) {
    const chunk = sentences.slice(i, i + 4)
    const avgScore = chunk.reduce((s, c) => s + c.score, 0) / chunk.length
    paragraphs.push({ sentences: chunk, avgScore, index: paragraphs.length })
  }

  const aiParagraphs = paragraphs.filter((p) => p.avgScore >= 0.55)
  const humanParagraphs = paragraphs.filter((p) => p.avgScore < 0.4)
  const isMixed = aiParagraphs.length > 0 && humanParagraphs.length > 0

  if (!isMixed) return null

  const aiPct = Math.round((aiParagraphs.length / paragraphs.length) * 100)

  return (
    <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800 p-4 sm:p-6">
      <h3 className="text-lg font-bold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        نص مختلط (بشري + AI)
      </h3>
      <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
        {aiPct}% من الفقرات تظهر سمات AI ({aiParagraphs.length} من {paragraphs.length} فقرات)
      </p>

      <div className="flex gap-1 h-4 rounded-full overflow-hidden mb-3">
        {paragraphs.map((p, i) => (
          <div
            key={i}
            className="flex-1 transition-all"
            style={{
              backgroundColor: p.avgScore >= 0.55 ? 'rgba(239,68,68,0.5)' : p.avgScore >= 0.4 ? 'rgba(234,179,8,0.4)' : 'rgba(34,197,94,0.4)',
            }}
            title={`فقرة ${i + 1}: ${Math.round(p.avgScore * 100)}%`}
          />
        ))}
      </div>

      <div className="flex gap-4 text-xs text-amber-600 dark:text-amber-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> AI مشبوه</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> غير واضح</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" /> بشري</span>
      </div>
    </div>
  )
}

export default MixedTextDetector
