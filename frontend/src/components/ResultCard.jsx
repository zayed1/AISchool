import { useState, useEffect } from 'react'

const colorMap = {
  red: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', ring: 'text-red-500' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', ring: 'text-orange-500' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', ring: 'text-yellow-500' },
  lightgreen: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', ring: 'text-emerald-500' },
  green: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', ring: 'text-green-500' },
}

function ResultCard({ result }) {
  const colors = colorMap[result.color] || colorMap.yellow
  const circumference = 2 * Math.PI * 54
  const targetOffset = circumference - (result.percentage / 100) * circumference

  // #3 — Counter animation
  const [displayPercent, setDisplayPercent] = useState(0)
  const [currentOffset, setCurrentOffset] = useState(circumference)

  useEffect(() => {
    const duration = 1200
    const startTime = performance.now()

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)

      setDisplayPercent(Math.round(eased * result.percentage))
      setCurrentOffset(circumference - eased * (result.percentage / 100) * circumference)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [result.percentage, circumference])

  return (
    <div className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-8 text-center`}>
      <div className="relative w-44 h-44 mx-auto mb-6">
        <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="7" />
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
          <span className={`text-5xl font-bold ${colors.text}`}>{displayPercent}%</span>
          <span className="text-xs text-slate-400 mt-1">احتمال ذكاء اصطناعي</span>
        </div>
      </div>
      <h2 className={`text-xl font-bold ${colors.text}`}>{result.level}</h2>
    </div>
  )
}

export default ResultCard
