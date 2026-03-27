import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || ''

function PricingPage({ onClose, onLogin }) {
  const { isAuthenticated, plan: userPlan, session, isPro, refreshPlan } = useAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/api/billing/plans`).then(r => r.json()).then(d => setPlans(d.plans || [])).catch(() => {})
  }, [])

  const handleUpgrade = async () => {
    if (!isAuthenticated) { onLogin(); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else throw new Error(data.detail)
    } catch {
      alert('فشل إنشاء جلسة الدفع')
    } finally {
      setLoading(false)
    }
  }

  const handleManage = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/billing/portal`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {}
    setLoading(false)
  }

  const planStyles = {
    free: { border: 'border-slate-200 dark:border-slate-700', badge: '' },
    pro: { border: 'border-primary-400 dark:border-primary-600 ring-2 ring-primary-100 dark:ring-primary-900/30', badge: 'الأكثر شعبية' },
    enterprise: { border: 'border-slate-200 dark:border-slate-700', badge: '' },
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">خطط الاشتراك</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">اختر الخطة المناسبة لاحتياجاتك</p>
      </div>

      {/* Usage bar */}
      {isAuthenticated && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">الاستخدام اليومي</span>
            <span className="text-sm text-slate-500">{userPlan.usage_today} / {userPlan.daily_limit}</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${Math.min(100, (userPlan.usage_today / userPlan.daily_limit) * 100)}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-1">الخطة الحالية: <span className="font-medium text-primary-600 dark:text-primary-400">{userPlan.plan_name}</span></p>
        </div>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => {
          const style = planStyles[p.id] || planStyles.free
          const isCurrent = userPlan.plan === p.id
          return (
            <div key={p.id} className={`bg-white dark:bg-slate-800 rounded-2xl border-2 ${style.border} p-6 relative flex flex-col`}>
              {style.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">{style.badge}</span>
              )}

              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{p.name}</h3>
                <div className="mt-2">
                  {p.price === 0 ? (
                    <span className="text-3xl font-bold text-slate-800 dark:text-slate-200">مجاني</span>
                  ) : p.price === -1 ? (
                    <span className="text-xl font-bold text-slate-800 dark:text-slate-200">تواصل معنا</span>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold text-slate-800 dark:text-slate-200">${p.price}</span>
                      <span className="text-sm text-slate-500 mr-1">/ شهرياً</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 flex-1 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <svg className="w-4 h-4 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>{p.daily_limit === 999999 ? 'غير محدود' : `${p.daily_limit} تحليل`} / يوم</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <svg className="w-4 h-4 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>حتى {p.max_words} كلمة</span>
                </div>
                {p.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <svg className="w-4 h-4 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              {/* Action button */}
              {p.id === 'free' ? (
                <button disabled={isCurrent} className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl text-sm disabled:opacity-50">
                  {isCurrent ? 'الخطة الحالية' : 'مجاني'}
                </button>
              ) : p.id === 'pro' ? (
                isCurrent ? (
                  <button onClick={handleManage} disabled={loading} className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl text-sm">
                    إدارة الاشتراك
                  </button>
                ) : (
                  <button onClick={handleUpgrade} disabled={loading} className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-sm transition-colors">
                    {loading ? 'جارٍ...' : 'اشترك الآن'}
                  </button>
                )
              ) : (
                <a href="mailto:contact@example.com" className="w-full py-2.5 bg-slate-800 dark:bg-slate-600 text-white font-medium rounded-xl text-sm text-center block">
                  تواصل معنا
                </a>
              )}
            </div>
          )
        })}
      </div>

      <button onClick={onClose} className="w-full py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors border border-slate-200 dark:border-slate-600">
        الرجوع
      </button>
    </div>
  )
}

export default PricingPage
