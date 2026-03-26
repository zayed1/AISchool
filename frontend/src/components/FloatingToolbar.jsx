// Floating action bar for Home page — paste, clear, analyze shortcuts
import { useState } from 'react'

function FloatingToolbar({ onPaste, onClear, onSubmit, canSubmit, hasText, loading }) {
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  if (!hasText && !loading) return null

  const handleClear = () => {
    if (showClearConfirm) {
      onClear()
      setShowClearConfirm(false)
    } else {
      setShowClearConfirm(true)
      setTimeout(() => setShowClearConfirm(false), 3000)
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 no-print" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 px-3 py-2">
        {/* Paste */}
        <button
          onClick={onPaste}
          className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="لصق من الحافظة وتحليل"
          title="لصق من الحافظة"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </button>

        {/* Clear — with confirmation */}
        {hasText && (
          <button
            onClick={handleClear}
            className={`p-2.5 rounded-xl transition-colors ${showClearConfirm ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'text-slate-500 dark:text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400'}`}
            aria-label={showClearConfirm ? 'اضغط مرة أخرى للتأكيد' : 'مسح النص'}
            title={showClearConfirm ? 'اضغط مرة أخرى للتأكيد' : 'مسح النص'}
          >
            {showClearConfirm ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            )}
          </button>
        )}

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

        {/* Submit */}
        <button
          onClick={onSubmit}
          disabled={!canSubmit || loading}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm flex items-center gap-2"
          aria-label="تحقق من النص"
          aria-disabled={!canSubmit || loading}
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          )}
          تحقق
        </button>
      </div>
    </div>
  )
}

export default FloatingToolbar
