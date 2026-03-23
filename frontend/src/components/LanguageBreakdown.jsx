// #23 — Language breakdown: show percentage of Arabic, English, numbers, other
function LanguageBreakdown({ text }) {
  if (!text || text.length < 50) return null

  const chars = [...text].filter((c) => c.trim().length > 0)
  if (chars.length < 30) return null

  let arabic = 0, english = 0, digits = 0, other = 0
  for (const c of chars) {
    if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(c)) arabic++
    else if (/[a-zA-Z]/.test(c)) english++
    else if (/[0-9\u0660-\u0669]/.test(c)) digits++
    else other++
  }

  const total = chars.length
  const pcts = {
    arabic: Math.round((arabic / total) * 100),
    english: Math.round((english / total) * 100),
    digits: Math.round((digits / total) * 100),
    other: Math.round((other / total) * 100),
  }

  // Only show if there's meaningful non-Arabic content
  if (pcts.arabic > 95) return null

  const segments = [
    { label: 'عربي', pct: pcts.arabic, color: 'bg-emerald-400', textColor: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'إنجليزي', pct: pcts.english, color: 'bg-blue-400', textColor: 'text-blue-600 dark:text-blue-400' },
    { label: 'أرقام', pct: pcts.digits, color: 'bg-amber-400', textColor: 'text-amber-600 dark:text-amber-400' },
    { label: 'أخرى', pct: pcts.other, color: 'bg-slate-400', textColor: 'text-slate-500 dark:text-slate-400' },
  ].filter((s) => s.pct > 0)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        توزيع اللغات
      </h4>

      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden mb-2">
        {segments.map((s) => (
          <div key={s.label} className={`${s.color} transition-all`} style={{ width: `${s.pct}%` }} title={`${s.label}: ${s.pct}%`} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px]">
        {segments.map((s) => (
          <span key={s.label} className={`flex items-center gap-1 ${s.textColor}`}>
            <span className={`w-2 h-2 rounded-full ${s.color}`} />
            {s.label} {s.pct}%
          </span>
        ))}
      </div>

      {pcts.arabic < 30 && (
        <p className="text-[10px] text-red-500 mt-1.5">
          تحذير: نسبة العربية منخفضة ({pcts.arabic}%) — قد تتأثر دقة التحليل
        </p>
      )}
    </div>
  )
}

export default LanguageBreakdown
