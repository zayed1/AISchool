// #9 — Reliability meter for the analysis itself
function ReliabilityMeter({ reliability, result }) {
  if (!reliability) return null

  const { score, level, factors } = reliability
  const colorMap = { 'عالية': 'text-green-600 dark:text-green-400', 'متوسطة': 'text-amber-600 dark:text-amber-400', 'منخفضة': 'text-red-600 dark:text-red-400' }
  const bgMap = { 'عالية': 'bg-green-400', 'متوسطة': 'bg-amber-400', 'منخفضة': 'bg-red-400' }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          موثوقية التحليل
        </h4>
        <span className={`text-sm font-bold ${colorMap[level]}`}>{level} ({score}%)</span>
      </div>

      <div className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden mb-2">
        <div className={`h-full rounded-full transition-all duration-700 ${bgMap[level]}`} style={{ width: `${score}%` }} />
      </div>

      {/* Confidence interval */}
      {result?.confidence_low != null && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
          نطاق الثقة: {result.confidence_low}% — {result.confidence_high}%
          <span className="text-slate-300 dark:text-slate-600 mx-1">|</span>
          أوزان: ML {Math.round(result.ml_weight * 100)}% / إحصائي {Math.round(result.stat_weight * 100)}%
        </p>
      )}

      {factors && factors.length > 0 && (
        <div className="space-y-1">
          {factors.map((f, i) => (
            <p key={i} className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>
              {f}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

export default ReliabilityMeter
