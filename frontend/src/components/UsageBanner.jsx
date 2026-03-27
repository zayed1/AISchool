// Usage banner — shows daily free usage with upgrade CTA
import { useAuth } from '../contexts/AuthContext'

function UsageBanner({ onPricing, onLogin }) {
  const { isAuthenticated, plan, isPro } = useAuth()

  // Don't show for pro users
  if (isPro) return null

  const used = plan.usage_today || 0
  const limit = plan.daily_limit || 10
  const remaining = Math.max(0, limit - used)
  const percent = Math.min(100, (used / limit) * 100)
  const isLow = remaining <= 3
  const isEmpty = remaining === 0

  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${isEmpty ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : isLow ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <svg className={`w-4 h-4 shrink-0 ${isEmpty ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {isEmpty ? 'انتهت تحليلاتك المجانية اليوم' : `${remaining} تحليل متبقي اليوم`}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-1.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isEmpty ? 'bg-red-400' : isLow ? 'bg-amber-400' : 'bg-primary-400'}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            {used} من {limit} — {isAuthenticated ? `الخطة المجانية` : 'بدون حساب'}
            {!isAuthenticated && ' · سجل دخولك لحفظ سجلك'}
          </p>
        </div>

        {/* CTA */}
        <div className="shrink-0">
          {!isAuthenticated ? (
            <button onClick={onLogin} className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-lg transition-colors">
              سجل مجاناً
            </button>
          ) : (
            <button onClick={onPricing} className="px-3 py-1.5 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white text-xs font-medium rounded-lg transition-all">
              ترقية PRO
            </button>
          )}
        </div>
      </div>

      {/* Upgrade hint */}
      {(isLow || isEmpty) && (
        <button onClick={onPricing} className="mt-2 w-full text-center text-[11px] text-primary-600 dark:text-primary-400 hover:underline">
          احصل على 200 تحليل/يوم + تحليل مفصل + وضع المعلم مع الخطة الاحترافية
        </button>
      )}
    </div>
  )
}

export default UsageBanner
