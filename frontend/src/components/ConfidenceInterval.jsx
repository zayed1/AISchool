// #5 — Confidence interval display around main result
function ConfidenceInterval({ result, statistical, ml }) {
  if (!result || !statistical || !ml) return null

  // Calculate confidence band based on engine agreement and text length
  const engineDiff = Math.abs(ml.ml_score - statistical.statistical_score)
  const halfBand = Math.round(engineDiff * 30 + 5) // 5-35% band

  const low = Math.max(0, result.percentage - halfBand)
  const high = Math.min(100, result.percentage + halfBand)

  const agreement = engineDiff < 0.15 ? 'high' : engineDiff < 0.3 ? 'medium' : 'low'
  const agreementMeta = {
    high: { label: 'اتفاق عالٍ', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/10' },
    medium: { label: 'اتفاق متوسط', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/10' },
    low: { label: 'اختلاف بين المحرّكين', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/10' },
  }

  const meta = agreementMeta[agreement]

  return (
    <div className={`rounded-xl border border-slate-200 dark:border-slate-700 p-4 ${meta.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          نطاق الثقة
        </h4>
        <span className={`text-xs font-bold ${meta.color}`}>{meta.label}</span>
      </div>

      {/* Visual range bar */}
      <div className="relative h-6 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
        {/* Gradient background */}
        <div className="absolute inset-0 flex">
          <div className="flex-1 bg-gradient-to-l from-yellow-200/50 to-green-200/50 dark:from-yellow-900/20 dark:to-green-900/20" />
          <div className="flex-1 bg-gradient-to-r from-yellow-200/50 to-red-200/50 dark:from-yellow-900/20 dark:to-red-900/20" />
        </div>

        {/* Confidence band */}
        <div
          className="absolute top-1 bottom-1 bg-primary-400/30 dark:bg-primary-500/20 border border-primary-400/50 dark:border-primary-500/30 rounded-full"
          style={{ left: `${low}%`, width: `${high - low}%` }}
        />

        {/* Center marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary-600 dark:bg-primary-400"
          style={{ left: `${result.percentage}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-slate-400">
        <span>0% بشري</span>
        <span className="font-bold text-slate-600 dark:text-slate-300">
          {low}% — {result.percentage}% — {high}%
        </span>
        <span>100% AI</span>
      </div>

      {/* Engine scores */}
      <div className="flex gap-4 mt-2 text-[10px] text-slate-400">
        <span>إحصائي: <span className="font-bold text-slate-600 dark:text-slate-300">{Math.round(statistical.statistical_score * 100)}%</span></span>
        <span>ML: <span className="font-bold text-slate-600 dark:text-slate-300">{Math.round(ml.ml_score * 100)}%</span></span>
        <span>الفرق: <span className={`font-bold ${meta.color}`}>{Math.round(engineDiff * 100)}%</span></span>
      </div>
    </div>
  )
}

export default ConfidenceInterval
