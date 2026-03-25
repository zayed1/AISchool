// Advanced History Panel with search, filter, sort, CSV export
import { useState, useEffect, useMemo } from 'react'

function HistoryPanel({ onSelect }) {
  const [history, setHistory] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterColor, setFilterColor] = useState('all')
  const [sortBy, setSortBy] = useState('date') // date | percentage | words

  useEffect(() => {
    try {
      const saved = localStorage.getItem('analysis_history')
      if (saved) setHistory(JSON.parse(saved))
    } catch {}
  }, [])

  const filtered = useMemo(() => {
    let items = [...history]
    // Search
    if (search.trim()) {
      items = items.filter((item) => item.preview?.includes(search.trim()))
    }
    // Filter by color
    if (filterColor !== 'all') {
      items = items.filter((item) => item.result?.color === filterColor)
    }
    // Sort
    if (sortBy === 'percentage') {
      items.sort((a, b) => (b.result?.percentage || 0) - (a.result?.percentage || 0))
    } else if (sortBy === 'words') {
      items.sort((a, b) => (b.metadata?.word_count || 0) - (a.metadata?.word_count || 0))
    }
    // date is default order (already newest first)
    return items
  }, [history, search, filterColor, sortBy])

  // Usage stats
  const stats = useMemo(() => {
    if (history.length === 0) return null
    const avgPct = Math.round(history.reduce((s, h) => s + (h.result?.percentage || 0), 0) / history.length)
    const aiCount = history.filter((h) => (h.result?.percentage || 0) >= 50).length
    const humanCount = history.length - aiCount
    return { total: history.length, avgPct, aiCount, humanCount }
  }, [history])

  // #9 — Show empty state instead of hiding
  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium">سجلك فارغ</p>
            <p className="text-xs">تحليلاتك السابقة ستظهر هنا — يمكنك البحث والفلترة والتصدير</p>
          </div>
        </div>
      </div>
    )
  }

  const clearHistory = () => {
    localStorage.removeItem('analysis_history')
    setHistory([])
  }

  const deleteItem = (index) => {
    const updated = history.filter((_, i) => i !== index)
    setHistory(updated)
    localStorage.setItem('analysis_history', JSON.stringify(updated))
  }

  // CSV export
  const exportCSV = () => {
    const header = 'النص,النسبة,المستوى,عدد الكلمات,التاريخ\n'
    const rows = history.map((h) =>
      `"${(h.preview || '').replace(/"/g, '""')}",${h.result?.percentage || 0},"${h.result?.level || ''}",${h.metadata?.word_count || 0},"${h.date || ''}"`
    ).join('\n')
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'analysis-history.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const colorDot = {
    red: 'bg-red-400', orange: 'bg-orange-400', yellow: 'bg-yellow-400',
    lightgreen: 'bg-emerald-400', green: 'bg-green-400',
  }

  const colorFilters = [
    { value: 'all', label: 'الكل' },
    { value: 'red', label: 'AI' },
    { value: 'orange', label: 'مشبوه' },
    { value: 'yellow', label: 'غير واضح' },
    { value: 'green', label: 'بشري' },
  ]

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        aria-expanded={isOpen}
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
        <div className="border-t border-slate-100 dark:border-slate-700">
          {/* Stats bar */}
          {stats && (
            <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 text-center text-xs">
              <div><span className="font-bold text-slate-700 dark:text-slate-300">{stats.total}</span><br /><span className="text-slate-400">إجمالي</span></div>
              <div><span className="font-bold text-slate-700 dark:text-slate-300">{stats.avgPct}%</span><br /><span className="text-slate-400">متوسط</span></div>
              <div><span className="font-bold text-red-500">{stats.aiCount}</span><br /><span className="text-slate-400">AI</span></div>
              <div><span className="font-bold text-green-500">{stats.humanCount}</span><br /><span className="text-slate-400">بشري</span></div>
            </div>
          )}

          {/* Search + filters */}
          <div className="p-3 space-y-2 border-b border-slate-100 dark:border-slate-700">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في السجل..."
              className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-slate-200 outline-none focus:border-primary-400"
              dir="rtl"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1">
                {colorFilters.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilterColor(f.value)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${filterColor === f.value ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-slate-500 dark:text-slate-400 outline-none"
              >
                <option value="date">الأحدث</option>
                <option value="percentage">النسبة</option>
                <option value="words">الكلمات</option>
              </select>
            </div>
          </div>

          {/* Items list */}
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-4">لا توجد نتائج</p>
            ) : (
              filtered.map((item, index) => {
                const origIdx = history.indexOf(item)
                return (
                  <div key={index} className="flex items-center border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <button
                      onClick={() => onSelect(item)}
                      className="flex-1 text-right px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorDot[item.result?.color] || 'bg-slate-300'}`} />
                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate flex-1">{item.preview}</span>
                        <span className="text-xs text-slate-400 shrink-0">{item.result?.percentage}%</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 mr-4">
                        <span className="text-xs text-slate-400">{item.metadata?.word_count} كلمة</span>
                        <span className="text-xs text-slate-300 dark:text-slate-600">·</span>
                        <span className="text-xs text-slate-400">{item.date}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => deleteItem(origIdx)}
                      className="px-2 text-slate-300 hover:text-red-400 dark:text-slate-600 dark:hover:text-red-400 transition-colors shrink-0"
                      title="حذف"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer actions */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 transition-colors">
              مسح السجل
            </button>
            <button onClick={exportCSV} className="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 flex items-center gap-1 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              تصدير CSV
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
    if (history.length > 50) history.pop()
    localStorage.setItem('analysis_history', JSON.stringify(history))
  } catch {}
}

export default HistoryPanel
