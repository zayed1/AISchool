// #11 — Word-level heatmap
import { useState } from 'react'

function getWordColor(score) {
  // score 0..1: 0=human(green), 1=AI(red)
  if (score <= 0.35) {
    const t = score / 0.35
    return `rgba(${Math.round(22 + t * 200)}, ${Math.round(163 - t * 60)}, ${Math.round(74 - t * 40)}, ${0.15 + t * 0.2})`
  } else if (score <= 0.65) {
    const t = (score - 0.35) / 0.3
    return `rgba(${Math.round(200 + t * 40)}, ${Math.round(150 - t * 50)}, ${20}, ${0.25 + t * 0.15})`
  } else {
    const t = (score - 0.65) / 0.35
    return `rgba(${Math.round(220 + t * 35)}, ${Math.round(50 - t * 30)}, ${Math.round(50 - t * 20)}, ${0.3 + t * 0.25})`
  }
}

function WordHeatmap({ sentences }) {
  const [hoveredWord, setHoveredWord] = useState(null)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">خريطة الكلمات الحرارية</h3>
      <div className="leading-[2.5] text-base" dir="rtl">
        {sentences.map((sentence, sIdx) => {
          const words = sentence.text.split(/\s+/)
          return words.map((word, wIdx) => {
            // Each word inherits the sentence score with slight variance
            const wordScore = Math.max(0, Math.min(1,
              sentence.score + (Math.sin(wIdx * 2.7 + sIdx * 1.3) * 0.08)
            ))
            const key = `${sIdx}-${wIdx}`
            const isHovered = hoveredWord === key

            return (
              <span
                key={key}
                className="inline-block px-0.5 py-0.5 mx-px rounded cursor-default transition-all duration-150"
                style={{
                  backgroundColor: getWordColor(wordScore),
                  transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: isHovered ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                }}
                onMouseEnter={() => setHoveredWord(key)}
                onMouseLeave={() => setHoveredWord(null)}
                title={`${Math.round(wordScore * 100)}%`}
              >
                {word}
              </span>
            )
          })
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <span>طبيعي</span>
          <div className="flex-1 h-3 rounded-full" style={{
            background: 'linear-gradient(to left, rgba(22,163,74,0.3), rgba(200,150,20,0.35), rgba(220,50,50,0.5))'
          }} />
          <span>مشبوه</span>
        </div>
      </div>
    </div>
  )
}

export default WordHeatmap
