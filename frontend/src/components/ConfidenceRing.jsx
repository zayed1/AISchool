// Confidence ring — animated ring around ML confidence score
import { useState, useEffect } from 'react'

function ConfidenceRing({ confidence, label, size = 80 }) {
  const r = (size - 8) / 2
  const circumference = 2 * Math.PI * r
  const [offset, setOffset] = useState(circumference)

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - confidence * circumference)
    }, 300)
    return () => clearTimeout(timer)
  }, [confidence, circumference])

  const pct = Math.round(confidence * 100)
  const isAI = label?.toUpperCase() === 'AI'
  const color = isAI ? '#ef4444' : '#22c55e'

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" className="dark:stroke-slate-700" />
          <circle
            cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>{pct}%</span>
          <span className="text-[9px] text-slate-400">ثقة</span>
        </div>
      </div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isAI ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
        {isAI ? 'ذكاء اصطناعي' : 'بشري'}
      </span>
    </div>
  )
}

export default ConfidenceRing
