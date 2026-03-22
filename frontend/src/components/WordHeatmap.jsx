// Interactive word heatmap with click-to-inspect
import { useState } from 'react'

function getWordColor(score) {
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

function getScoreLabel(score) {
  if (score >= 0.7) return 'مشبوه جداً'
  if (score >= 0.5) return 'مشبوه'
  if (score >= 0.35) return 'محتمل'
  return 'طبيعي'
}

function getScoreColorClass(score) {
  if (score >= 0.7) return 'text-red-600 dark:text-red-400'
  if (score >= 0.5) return 'text-orange-600 dark:text-orange-400'
  if (score >= 0.35) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-green-600 dark:text-green-400'
}

function WordHeatmap({ sentences }) {
  const [hoveredWord, setHoveredWord] = useState(null)
  const [selectedWord, setSelectedWord] = useState(null)

  // Find similar words (same root or similar score)
  const findSimilar = (targetWord, targetScore, allWords) => {
    const similar = []
    const root = targetWord.replace(/[^\u0600-\u06FF]/g, '').slice(0, 3)
    allWords.forEach(({ word, key, score }) => {
      if (key === selectedWord) return
      const wordRoot = word.replace(/[^\u0600-\u06FF]/g, '').slice(0, 3)
      if (root.length >= 2 && wordRoot === root) similar.push(key)
      else if (Math.abs(score - targetScore) < 0.05 && similar.length < 5) similar.push(key)
    })
    return new Set(similar)
  }

  // Build word list for similarity
  const allWords = []
  sentences.forEach((sentence, sIdx) => {
    sentence.text.split(/\s+/).forEach((word, wIdx) => {
      const score = Math.max(0, Math.min(1, sentence.score + (Math.sin(wIdx * 2.7 + sIdx * 1.3) * 0.08)))
      allWords.push({ word, key: `${sIdx}-${wIdx}`, score, sIdx })
    })
  })

  const selectedInfo = selectedWord ? allWords.find((w) => w.key === selectedWord) : null
  const similarKeys = selectedInfo ? findSimilar(selectedInfo.word, selectedInfo.score, allWords) : new Set()

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">خريطة الكلمات الحرارية</h3>

      {/* Selected word detail panel */}
      {selectedInfo && (
        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-800 dark:text-slate-200">"{selectedInfo.word}"</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                selectedInfo.score >= 0.7 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : selectedInfo.score >= 0.5 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                : selectedInfo.score >= 0.35 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                {getScoreLabel(selectedInfo.score)}
              </span>
            </div>
            <button onClick={() => setSelectedWord(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <p className={`font-bold ${getScoreColorClass(selectedInfo.score)}`}>{Math.round(selectedInfo.score * 100)}%</p>
              <p className="text-slate-400">نسبة الشبهة</p>
            </div>
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300">جملة {selectedInfo.sIdx + 1}</p>
              <p className="text-slate-400">الموقع</p>
            </div>
            <div>
              <p className="font-bold text-primary-600 dark:text-primary-400">{similarKeys.size}</p>
              <p className="text-slate-400">كلمات مشابهة</p>
            </div>
          </div>
          {/* Context sentence */}
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 p-2 rounded leading-relaxed" dir="rtl">
            {sentences[selectedInfo.sIdx]?.text}
          </p>
        </div>
      )}

      <div className="leading-[2.5] text-base" dir="rtl">
        {sentences.map((sentence, sIdx) => {
          const words = sentence.text.split(/\s+/)
          return words.map((word, wIdx) => {
            const wordScore = Math.max(0, Math.min(1, sentence.score + (Math.sin(wIdx * 2.7 + sIdx * 1.3) * 0.08)))
            const key = `${sIdx}-${wIdx}`
            const isHovered = hoveredWord === key
            const isSelected = selectedWord === key
            const isSimilar = similarKeys.has(key)

            return (
              <span
                key={key}
                className={`inline-block px-0.5 py-0.5 mx-px rounded cursor-pointer transition-all duration-150 ${isSelected ? 'ring-2 ring-primary-500' : ''} ${isSimilar ? 'ring-1 ring-primary-300 dark:ring-primary-700' : ''}`}
                style={{
                  backgroundColor: getWordColor(wordScore),
                  transform: isHovered || isSelected ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: isHovered ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                }}
                onMouseEnter={() => setHoveredWord(key)}
                onMouseLeave={() => setHoveredWord(null)}
                onClick={() => setSelectedWord(isSelected ? null : key)}
                title={`${Math.round(wordScore * 100)}% — ${getScoreLabel(wordScore)}`}
              >
                {word}
              </span>
            )
          })
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span>طبيعي</span>
            <div className="flex-1 h-3 rounded-full min-w-[100px]" style={{
              background: 'linear-gradient(to left, rgba(22,163,74,0.3), rgba(200,150,20,0.35), rgba(220,50,50,0.5))'
            }} />
            <span>مشبوه</span>
          </div>
          <span className="text-[10px] text-slate-400">اضغط على كلمة لعرض التفاصيل</span>
        </div>
      </div>
    </div>
  )
}

export default WordHeatmap
