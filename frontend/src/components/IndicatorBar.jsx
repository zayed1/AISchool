function IndicatorBar({ label, value, maxValue = 1 }) {
  const percentage = Math.min(Math.round((value / maxValue) * 100), 100)

  let barColor = 'bg-green-400'
  if (percentage >= 70) barColor = 'bg-red-400'
  else if (percentage >= 40) barColor = 'bg-yellow-400'

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{percentage}%</span>
      </div>
      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default IndicatorBar
