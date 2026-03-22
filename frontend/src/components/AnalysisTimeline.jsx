// #11 — Timeline of user's past analyses with mini chart
import { useMemo } from 'react'

function AnalysisTimeline() {
  const data = useMemo(() => {
    try {
      const history = JSON.parse(localStorage.getItem('analysis_history') || '[]')
      if (history.length < 2) return null
      return history.slice(0, 20).reverse() // oldest first for chart
    } catch { return null }
  }, [])

  if (!data) return null

  const maxPct = 100
  const chartH = 60
  const dotColors = { red: '#ef4444', orange: '#f97316', yellow: '#eab308', lightgreen: '#10b981', green: '#22c55e' }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        تطور التحليلات
      </h3>

      {/* Mini line chart */}
      <svg viewBox={`0 0 ${data.length * 30} ${chartH + 20}`} className="w-full h-20" preserveAspectRatio="none">
        {/* Line */}
        <polyline
          points={data.map((d, i) => `${i * 30 + 15},${chartH - (d.result?.percentage || 0) / maxPct * chartH + 5}`).join(' ')}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Dots */}
        {data.map((d, i) => {
          const y = chartH - (d.result?.percentage || 0) / maxPct * chartH + 5
          const color = dotColors[d.result?.color] || '#94a3b8'
          return <circle key={i} cx={i * 30 + 15} cy={y} r="4" fill={color} />
        })}
        {/* 50% threshold line */}
        <line x1="0" y1={chartH / 2 + 5} x2={data.length * 30} y2={chartH / 2 + 5} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" className="dark:stroke-slate-600" />
      </svg>

      <div className="flex justify-between text-[9px] text-slate-400 mt-1">
        <span>{data[0]?.date || ''}</span>
        <span className="text-slate-300 dark:text-slate-600">— خط 50% —</span>
        <span>{data[data.length - 1]?.date || ''}</span>
      </div>
    </div>
  )
}

export default AnalysisTimeline
