import { useState, useEffect } from 'react'

const colorMap = {
  red: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-300 dark:border-red-800', text: 'text-red-700 dark:text-red-400', ring: 'text-red-500' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-300 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-400', ring: 'text-orange-500' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-300 dark:border-yellow-800', text: 'text-yellow-700 dark:text-yellow-400', ring: 'text-yellow-500' },
  lightgreen: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-300 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400', ring: 'text-emerald-500' },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-300 dark:border-green-800', text: 'text-green-700 dark:text-green-400', ring: 'text-green-500' },
}

function ResultCard({ result }) {
  const colors = colorMap[result.color] || colorMap.yellow
  const circumference = 2 * Math.PI * 54

  const [displayPercent, setDisplayPercent] = useState(0)
  const [currentOffset, setCurrentOffset] = useState(circumference)

  useEffect(() => {
    const duration = 1200
    const startTime = performance.now()

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      setDisplayPercent(Math.round(eased * result.percentage))
      setCurrentOffset(circumference - eased * (result.percentage / 100) * circumference)

      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [result.percentage, circumference])

  return (
    <div className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-8 text-center`} role="status" aria-label={`النتيجة: ${result.percentage}% — ${result.level}`}>
      <div className="relative w-44 h-44 mx-auto mb-6">
        <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="7" className="dark:stroke-slate-700" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            className={colors.ring}
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={currentOffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-bold ${colors.text}`} aria-live="polite">{displayPercent}%</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">احتمال ذكاء اصطناعي</span>
        </div>
      </div>
      <h2 className={`text-xl font-bold ${colors.text}`}>{result.level}</h2>
    </div>
  )
}

export default ResultCard
