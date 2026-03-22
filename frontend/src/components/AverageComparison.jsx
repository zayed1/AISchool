// Average comparison — show current text vs global average per indicator
// Uses localStorage history to compute averages

import { useMemo } from 'react'

function AverageComparison({ statistical }) {
  const averages = useMemo(() => {
    try {
      const history = JSON.parse(localStorage.getItem('analysis_history') || '[]')
      if (history.length < 2) return null

      const keys = ['ttr', 'sentence_length_cv', 'repetitive_openers_ratio', 'connector_density', 'error_ratio', 'burstiness']
      const maxVals = { ttr: 1, sentence_length_cv: 1, repetitive_openers_ratio: 0.5, connector_density: 4, error_ratio: 0.05, burstiness: 1 }
      const labels = { ttr: 'المفردات', sentence_length_cv: 'التباين', repetitive_openers_ratio: 'الافتتاحيات', connector_density: 'الربط', error_ratio: 'الأخطاء', burstiness: 'الانفجارية' }

      const avgData = keys.map((key) => {
        const values = history.filter((h) => h.statistical?.[key] != null).map((h) => h.statistical[key])
        const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0
        const current = statistical[key] || 0
        const maxVal = maxVals[key]
        const avgPct = Math.min(Math.round((avg / maxVal) * 100), 100)
        const curPct = Math.min(Math.round((current / maxVal) * 100), 100)
        const diff = curPct - avgPct

        return { key, label: labels[key], avgPct, curPct, diff }
      })

      return { data: avgData, count: history.length }
    } catch { return null }
  }, [statistical])

  if (!averages) return null

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        مقارنة مع المتوسط
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">بناءً على {averages.count} تحليل سابق</p>

      <div className="space-y-3">
        {averages.data.map((item) => (
          <div key={item.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
              <span className={`font-bold ${item.diff > 10 ? 'text-red-500' : item.diff < -10 ? 'text-green-500' : 'text-slate-500'}`}>
                {item.diff > 0 ? '+' : ''}{item.diff}%
              </span>
            </div>
            <div className="relative h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              {/* Average marker */}
              <div className="absolute top-0 h-full w-0.5 bg-slate-400 dark:bg-slate-500 z-10" style={{ right: `${item.avgPct}%` }} title={`المتوسط: ${item.avgPct}%`} />
              {/* Current bar */}
              <div
                className={`h-full rounded-full transition-all duration-700 ${item.curPct >= 65 ? 'bg-red-400' : item.curPct >= 35 ? 'bg-yellow-400' : 'bg-green-400'}`}
                style={{ width: `${item.curPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>الحالي: {item.curPct}%</span>
              <span>المتوسط: {item.avgPct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AverageComparison
