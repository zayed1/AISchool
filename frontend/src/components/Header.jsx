import { useTheme } from '../contexts/ThemeContext'

function Header({ onCompareToggle, isCompareMode }) {
  const { dark, toggleTheme } = useTheme()

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center" aria-hidden="true">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">كاشف الذكاء الاصطناعي</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">أداة كشف النصوص العربية المولدة بالذكاء الاصطناعي</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* #7 — Compare mode toggle */}
            <button
              onClick={onCompareToggle}
              className={`p-2 rounded-lg transition-colors ${
                isCompareMode
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-500'
              }`}
              title="مقارنة نصين"
              aria-label="تفعيل وضع المقارنة"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </button>

            {/* #5 — Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-500 transition-colors"
              title={dark ? 'الوضع الفاتح' : 'الوضع الداكن'}
              aria-label={dark ? 'التبديل للوضع الفاتح' : 'التبديل للوضع الداكن'}
            >
              {dark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* #6 — Keyboard shortcuts help */}
            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 mr-2">
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono">Ctrl+Enter</kbd>
              <span>تحليل</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
