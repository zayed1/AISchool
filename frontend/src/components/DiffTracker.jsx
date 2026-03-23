// Text diff/change tracker — compare two versions
import { useState, useMemo } from 'react'

function diffWords(oldText, newText) {
  const oldWords = oldText.trim().split(/\s+/)
  const newWords = newText.trim().split(/\s+/)

  // Simple LCS-based diff
  const m = oldWords.length
  const n = newWords.length
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  // Backtrack
  const result = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      result.unshift({ type: 'same', word: oldWords[i - 1] })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', word: newWords[j - 1] })
      j--
    } else {
      result.unshift({ type: 'removed', word: oldWords[i - 1] })
      i--
    }
  }

  return result
}

function DiffTracker({ onClose }) {
  const [textA, setTextA] = useState('')
  const [textB, setTextB] = useState('')
  const [showDiff, setShowDiff] = useState(false)

  const diff = useMemo(() => {
    if (!showDiff || !textA.trim() || !textB.trim()) return []
    return diffWords(textA, textB)
  }, [textA, textB, showDiff])

  const stats = useMemo(() => {
    if (diff.length === 0) return null
    const added = diff.filter((d) => d.type === 'added').length
    const removed = diff.filter((d) => d.type === 'removed').length
    const same = diff.filter((d) => d.type === 'same').length
    const total = same + removed
    const changePercent = total > 0 ? Math.round(((added + removed) / (total + added)) * 100) : 0
    return { added, removed, same, changePercent }
  }, [diff])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">تتبع التغييرات</h2>
        <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <p className="text-slate-500 dark:text-slate-400 text-sm text-center">الصق النسخة الأصلية والمعدّلة لمعرفة أين تمت التغييرات</p>

      {/* #12 — Example guide when both empty */}
      {!textA && !textB && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 text-center">مثال على المقارنة</p>
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-2.5 leading-relaxed border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">الأصلي:</span>
              الذكاء الاصطناعي <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 line-through px-0.5 rounded">يساعد</span> الطلاب في التعلم
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-2.5 leading-relaxed border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">المعدّل:</span>
              الذكاء الاصطناعي <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 underline px-0.5 rounded">يُمكّن</span> الطلاب في التعلم
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">النسخة الأصلية</label>
          <textarea
            value={textA}
            onChange={(e) => { setTextA(e.target.value); setShowDiff(false) }}
            placeholder="الصق النص الأصلي..."
            className="w-full min-h-[160px] p-3 text-sm border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-slate-100 outline-none focus:border-primary-500 resize-y"
            dir="rtl"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">النسخة المعدّلة</label>
          <textarea
            value={textB}
            onChange={(e) => { setTextB(e.target.value); setShowDiff(false) }}
            placeholder="الصق النص المعدّل..."
            className="w-full min-h-[160px] p-3 text-sm border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-slate-100 outline-none focus:border-primary-500 resize-y"
            dir="rtl"
          />
        </div>
      </div>

      <button
        onClick={() => setShowDiff(true)}
        disabled={!textA.trim() || !textB.trim()}
        className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
      >
        عرض التغييرات
      </button>

      {showDiff && diff.length > 0 && (
        <>
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-3">
                <p className="text-lg font-bold text-green-600 dark:text-green-400">+{stats.added}</p>
                <p className="text-[10px] text-slate-400">مضاف</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-3">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">-{stats.removed}</p>
                <p className="text-[10px] text-slate-400">محذوف</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <p className="text-lg font-bold text-slate-600 dark:text-slate-300">{stats.same}</p>
                <p className="text-[10px] text-slate-400">بدون تغيير</p>
              </div>
              <div className="bg-primary-50 dark:bg-primary-900/10 rounded-lg p-3">
                <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{stats.changePercent}%</p>
                <p className="text-[10px] text-slate-400">نسبة التغيير</p>
              </div>
            </div>
          )}

          {/* Diff display */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 leading-[2.2] text-base" dir="rtl">
            {diff.map((d, i) => (
              <span
                key={i}
                className={`inline mx-0.5 px-0.5 rounded ${
                  d.type === 'added' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 underline decoration-green-400'
                  : d.type === 'removed' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 line-through'
                  : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {d.word}
              </span>
            ))}
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30" /> مضاف</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30" /> محذوف</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-700" /> بدون تغيير</span>
          </div>
        </>
      )}
    </div>
  )
}

export default DiffTracker
