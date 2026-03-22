import { useState, useEffect } from 'react'

function HistoryPanel({ onSelect }) {
  const [history, setHistory] = useState([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('analysis_history')
      if (saved) setHistory(JSON.parse(saved))
    } catch {}
  }, [])

  if (history.length === 0) return null

  const clearHistory = () => {
    localStorage.removeItem('analysis_history')
    setHistory([])
  }

  const colorDot = {
    red: 'bg-red-400',
    orange: 'bg-orange-400',
    yellow: 'bg-yellow-400',
    lightgreen: 'bg-emerald-400',
    green: 'bg-green-400',
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          التحليلات السابقة ({history.length})
        </span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="border-t border-slate-100">
          <div className="max-h-48 overflow-y-auto">
            {history.map((item, index) => (
              <button
                key={index}
                onClick={() => onSelect(item)}
                className="w-full text-right px-4 py-3 hover:bg-slate-50 border-b border-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorDot[item.result.color] || 'bg-slate-300'}`} />
                  <span className="text-sm text-slate-700 truncate flex-1">{item.preview}</span>
                  <span className="text-xs text-slate-400 shrink-0">{item.result.percentage}%</span>
                </div>
                <div className="flex items-center gap-2 mt-1 mr-4">
                  <span className="text-xs text-slate-400">{item.metadata.word_count} كلمة</span>
                  <span className="text-xs text-slate-300">·</span>
                  <span className="text-xs text-slate-400">{item.date}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-slate-100">
            <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-600 transition-colors">
              مسح السجل
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function saveToHistory(data, text) {
  try {
    const saved = localStorage.getItem('analysis_history')
    const history = saved ? JSON.parse(saved) : []
    const entry = {
      ...data,
      preview: text.slice(0, 80) + (text.length > 80 ? '...' : ''),
      date: new Date().toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    }
    history.unshift(entry)
    if (history.length > 5) history.pop()
    localStorage.setItem('analysis_history', JSON.stringify(history))
  } catch {}
}

export default HistoryPanel
