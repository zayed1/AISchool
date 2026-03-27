// ProGate — wraps premium sections with blur + lock overlay for free users
import { useAuth } from '../contexts/AuthContext'

function ProGate({ children, onUpgrade, label }) {
  const { isPro } = useAuth()

  if (isPro) return children

  return (
    <div className="relative">
      {/* Teaser: show top portion then blur */}
      <div className="max-h-[120px] overflow-hidden relative">
        {children}
        {/* Gradient fade to blur */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 dark:to-transparent" />
      </div>

      {/* Lock overlay */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl -mt-4 relative z-10 p-4 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{label || 'محتوى احترافي'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">هذا القسم متاح في الخطة الاحترافية</p>
          <button
            onClick={onUpgrade}
            className="mt-1 px-5 py-2 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-primary-200 dark:shadow-primary-900/30"
          >
            اشترك بالخطة الاحترافية
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProGate
