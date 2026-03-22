// Presentation mode — fullscreen result display
import { useState, useEffect } from 'react'

function PresentationMode({ data, onExit }) {
  const { result, ml, metadata } = data
  const colorMap = { red: '#ef4444', orange: '#f97316', yellow: '#eab308', lightgreen: '#10b981', green: '#22c55e' }
  const accent = colorMap[result.color] || '#3b82f6'

  const [pct, setPct] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setPct(result.percentage), 100)
    return () => clearTimeout(timer)
  }, [result.percentage])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' || e.key === 'F11') { e.preventDefault(); onExit() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onExit])

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center text-white" dir="rtl">
      {/* Close button */}
      <button onClick={onExit} className="absolute top-6 left-6 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      {/* Hint */}
      <p className="absolute top-6 right-6 text-xs text-white/30">اضغط Escape أو F11 للخروج</p>

      {/* Big circle */}
      <div className="relative w-64 h-64 mb-8">
        <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
          <circle
            cx="100" cy="100" r="90" fill="none"
            stroke={accent}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 90}
            strokeDashoffset={2 * Math.PI * 90 * (1 - pct / 100)}
            style={{ transition: 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-7xl font-bold" style={{ color: accent }}>{result.percentage}%</span>
          <span className="text-sm text-white/50 mt-1">احتمال ذكاء اصطناعي</span>
        </div>
      </div>

      {/* Level */}
      <h2 className="text-2xl font-bold mb-8" style={{ color: accent }}>{result.level}</h2>

      {/* Stats row */}
      <div className="flex gap-12 text-center">
        <div>
          <p className="text-3xl font-bold">{metadata.word_count}</p>
          <p className="text-sm text-white/40">كلمة</p>
        </div>
        <div className="w-px bg-white/10" />
        <div>
          <p className="text-3xl font-bold">{ml.label.toUpperCase() === 'AI' ? 'AI' : 'بشري'}</p>
          <p className="text-sm text-white/40">تصنيف النموذج</p>
        </div>
        <div className="w-px bg-white/10" />
        <div>
          <p className="text-3xl font-bold">{Math.round(ml.confidence * 100)}%</p>
          <p className="text-sm text-white/40">ثقة</p>
        </div>
        <div className="w-px bg-white/10" />
        <div>
          <p className="text-3xl font-bold">{metadata.sentence_count}</p>
          <p className="text-sm text-white/40">جملة</p>
        </div>
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-xs text-white/20">كاشف النصوص المولدة بالذكاء الاصطناعي — نتائج تقديرية</p>
    </div>
  )
}

export default PresentationMode
