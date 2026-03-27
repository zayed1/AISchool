import { useAuth } from '../contexts/AuthContext'

function UsageBadge({ onLogin, onPricing }) {
  const { isAuthenticated, user, plan, signOut } = useAuth()

  if (!isAuthenticated) {
    return (
      <button onClick={onLogin} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-medium rounded-full transition-colors border border-primary-200 dark:border-primary-800">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        دخول
      </button>
    )
  }

  const usagePercent = Math.min(100, (plan.usage_today / plan.daily_limit) * 100)
  const isLow = usagePercent >= 80

  return (
    <div className="flex items-center gap-2">
      {/* Usage indicator */}
      <button onClick={onPricing} className="flex items-center gap-1.5 text-xs" title={`${plan.usage_today}/${plan.daily_limit} تحليل اليوم`}>
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${isLow ? 'bg-red-400' : 'bg-primary-400'}`} style={{ width: `${usagePercent}%` }} />
        </div>
        <span className={`font-medium ${isLow ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>{plan.usage_today}/{plan.daily_limit}</span>
        {plan.plan !== 'free' && <span className="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-[9px] font-bold rounded">PRO</span>}
      </button>

      {/* User avatar */}
      <div className="relative group">
        <button className="w-7 h-7 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-700 dark:text-primary-400 text-xs font-bold" title={user.email}>
          {user.email?.[0]?.toUpperCase() || '?'}
        </button>
        {/* Dropdown */}
        <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 w-40" dir="rtl">
            <p className="px-3 py-1.5 text-[10px] text-slate-400 truncate">{user.email}</p>
            <button onClick={onPricing} className="w-full text-right px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">الاشتراك</button>
            <button onClick={signOut} className="w-full text-right px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">تسجيل الخروج</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UsageBadge
