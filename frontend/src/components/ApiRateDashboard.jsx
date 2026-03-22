// #22 — API Rate Dashboard: visual chart of analysis usage over time
import { useMemo } from 'react'

function ApiRateDashboard() {
  const data = useMemo(() => {
    try {
      const history = JSON.parse(localStorage.getItem('analysis_history') || '[]')
      if (history.length < 2) return null

      // Group by hour for last 24 hours
      const now = Date.now()
      const hourBuckets = new Array(24).fill(0)
      const dayLabels = []

      for (let i = 23; i >= 0; i--) {
        const h = new Date(now - i * 3600000).getHours()
        dayLabels.push(`${h}:00`)
      }

      for (const item of history) {
        if (!item.timestamp) continue
        const hoursAgo = Math.floor((now - item.timestamp) / 3600000)
        if (hoursAgo >= 0 && hoursAgo < 24) {
          hourBuckets[23 - hoursAgo]++
        }
      }

      // Group by day for last 7 days
      const dayBuckets = new Array(7).fill(0)
      const dayNames = []
      const weekDays = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now - i * 86400000)
        dayNames.push(weekDays[date.getDay()])
      }

      for (const item of history) {
        if (!item.timestamp) continue
        const daysAgo = Math.floor((now - item.timestamp) / 86400000)
        if (daysAgo >= 0 && daysAgo < 7) {
          dayBuckets[6 - daysAgo]++
        }
      }

      // Score distribution
      const scoreRanges = { 'AI (70+)': 0, 'مشبوه (50-69)': 0, 'غير واضح (30-49)': 0, 'بشري (<30)': 0 }
      for (const item of history) {
        const pct = item.result?.percentage || 0
        if (pct >= 70) scoreRanges['AI (70+)']++
        else if (pct >= 50) scoreRanges['مشبوه (50-69)']++
        else if (pct >= 30) scoreRanges['غير واضح (30-49)']++
        else scoreRanges['بشري (<30)']++
      }

      return {
        hourBuckets, dayLabels: dayLabels.filter((_, i) => i % 4 === 0),
        dayBuckets, dayNames,
        scoreRanges,
        total: history.length,
        todayCount: dayBuckets[6],
      }
    } catch { return null }
  }, [])

  if (!data) return null

  const maxHour = Math.max(...data.hourBuckets, 1)
  const maxDay = Math.max(...data.dayBuckets, 1)
  const barW = 100 / 24

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          استهلاك التحليلات
        </h3>
        <div className="text-xs text-slate-400">
          اليوم: <span className="font-bold text-primary-500">{data.todayCount}</span> | الإجمالي: <span className="font-bold">{data.total}</span>
        </div>
      </div>

      {/* Hourly bar chart (24h) */}
      <div>
        <p className="text-[10px] text-slate-400 mb-1">آخر 24 ساعة</p>
        <div className="flex items-end gap-[1px] h-16">
          {data.hourBuckets.map((count, i) => (
            <div
              key={i}
              className="flex-1 bg-primary-400 dark:bg-primary-500 rounded-t-sm transition-all hover:bg-primary-500 dark:hover:bg-primary-400"
              style={{ height: `${(count / maxHour) * 100}%`, minHeight: count > 0 ? 3 : 0 }}
              title={`${count} تحليل`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[8px] text-slate-400 mt-0.5">
          {data.dayLabels.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      </div>

      {/* Weekly bar chart */}
      <div>
        <p className="text-[10px] text-slate-400 mb-1">آخر 7 أيام</p>
        <div className="flex items-end gap-1 h-14">
          {data.dayBuckets.map((count, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <span className="text-[8px] text-slate-400 font-bold">{count || ''}</span>
              <div
                className="w-full bg-blue-400 dark:bg-blue-500 rounded-t transition-all"
                style={{ height: `${(count / maxDay) * 100}%`, minHeight: count > 0 ? 4 : 0 }}
              />
              <span className="text-[8px] text-slate-400">{data.dayNames[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Score distribution */}
      <div>
        <p className="text-[10px] text-slate-400 mb-1">توزيع النتائج</p>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(data.scoreRanges).map(([label, count]) => {
            const colors = { 'AI (70+)': 'text-red-500', 'مشبوه (50-69)': 'text-orange-500', 'غير واضح (30-49)': 'text-amber-500', 'بشري (<30)': 'text-green-500' }
            return (
              <div key={label} className="text-center">
                <p className={`text-lg font-bold ${colors[label]}`}>{count}</p>
                <p className="text-[9px] text-slate-400">{label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ApiRateDashboard
