import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'

function SettingsPanel({ isOpen, onClose }) {
  const { dark, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('general')
  const [sensitivity, setSensitivity] = useState(() => {
    try { return localStorage.getItem('detection_sensitivity') || 'balanced' } catch { return 'balanced' }
  })
  const [privacyMode, setPrivacyMode] = useState(() => {
    try { return localStorage.getItem('privacy_mode') === 'true' } catch { return false }
  })
  const [tempPrivacy, setTempPrivacy] = useState(() => {
    try {
      const exp = localStorage.getItem('temp_privacy_expires')
      if (exp && Date.now() < Number(exp)) return true
      if (exp) localStorage.removeItem('temp_privacy_expires')
      return false
    } catch { return false }
  })
  const [tempMinutes, setTempMinutes] = useState(30)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => {
    try { return localStorage.getItem('reduced_motion') === 'true' } catch { return false }
  })

  useEffect(() => { localStorage.setItem('detection_sensitivity', sensitivity) }, [sensitivity])
  useEffect(() => { localStorage.setItem('privacy_mode', String(privacyMode || tempPrivacy)) }, [privacyMode, tempPrivacy])
  useEffect(() => { localStorage.setItem('reduced_motion', String(reducedMotion)) }, [reducedMotion])

  // #14 — Check temp privacy expiry
  useEffect(() => {
    if (!tempPrivacy) return
    const exp = Number(localStorage.getItem('temp_privacy_expires') || 0)
    if (!exp || Date.now() >= exp) {
      setTempPrivacy(false)
      localStorage.removeItem('temp_privacy_expires')
      localStorage.setItem('privacy_mode', 'false')
      return
    }
    const timeout = setTimeout(() => {
      setTempPrivacy(false)
      localStorage.removeItem('temp_privacy_expires')
      localStorage.setItem('privacy_mode', 'false')
    }, exp - Date.now())
    return () => clearTimeout(timeout)
  }, [tempPrivacy])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleTempPrivacy = () => {
    const expires = Date.now() + tempMinutes * 60 * 1000
    localStorage.setItem('temp_privacy_expires', String(expires))
    localStorage.setItem('privacy_mode', 'true')
    setTempPrivacy(true)
  }

  const handleClearData = () => {
    localStorage.removeItem('analysis_history')
    localStorage.removeItem('analysis_cache')
    localStorage.removeItem('user_feedback')
    localStorage.removeItem('rate_limit')
    sessionStorage.removeItem('draft_text')
    setShowDeleteConfirm(false)
    onClose()
  }

  const tabs = [
    { id: 'general', label: 'عام', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'privacy', label: 'خصوصية', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { id: 'detection', label: 'كشف', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { id: 'shortcuts', label: 'اختصارات', icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
    { id: 'data', label: 'بيانات', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
  ]

  return (
    <>
      <div className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 transition-opacity" onClick={onClose} aria-hidden="true" />
      <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-slate-800 shadow-2xl z-50 transition-transform duration-300 overflow-y-auto" dir="rtl" role="dialog" aria-label="الإعدادات">
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">الإعدادات</h2>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="إغلاق">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* #11 — Tab navigation */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-2 px-2" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>

          {/* === General Tab === */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">المظهر</label>
                <div className="flex gap-2">
                  <button onClick={() => { if (dark) toggleTheme() }} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${!dark ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>فاتح</button>
                  <button onClick={() => { if (!dark) toggleTheme() }} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${dark ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>داكن</button>
                </div>
              </div>

              {/* #15 — Reduced motion */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">تقليل الحركة</label>
                  <p className="text-xs text-slate-400 dark:text-slate-500">إيقاف الرسوم المتحركة</p>
                </div>
                <button
                  onClick={() => setReducedMotion(!reducedMotion)}
                  className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${reducedMotion ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                  role="switch"
                  aria-checked={reducedMotion}
                  aria-label="تقليل الحركة"
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${reducedMotion ? 'right-0.5' : 'right-5'}`} />
                </button>
              </div>
            </div>
          )}

          {/* === Privacy Tab === */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">وضع الخصوصية</label>
                  <p className="text-xs text-slate-400 dark:text-slate-500">لا يحفظ أي بيانات محلياً</p>
                </div>
                <button
                  onClick={() => setPrivacyMode(!privacyMode)}
                  className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${privacyMode ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                  role="switch"
                  aria-checked={privacyMode}
                  aria-label="وضع الخصوصية"
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${privacyMode ? 'right-0.5' : 'right-5'}`} />
                </button>
              </div>
              {privacyMode && (
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-2 text-xs text-primary-700 dark:text-primary-400">
                  مفعّل: لن يتم حفظ السجل أو النتائج المؤقتة. تُمسح البيانات عند إغلاق المتصفح.
                </div>
              )}

              {/* #14 — Temp privacy */}
              {!privacyMode && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">خصوصية مؤقتة</label>
                  <p className="text-xs text-slate-400 dark:text-slate-500">تفعيل وضع الخصوصية لفترة محددة ثم يعود تلقائياً</p>
                  {tempPrivacy ? (
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-2 text-xs text-green-700 dark:text-green-400 flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      الخصوصية المؤقتة مفعّلة — ستنتهي تلقائياً
                      <button onClick={() => { setTempPrivacy(false); localStorage.removeItem('temp_privacy_expires'); localStorage.setItem('privacy_mode', 'false') }} className="mr-auto text-red-500 hover:text-red-600 text-[10px]">إلغاء</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={tempMinutes}
                        onChange={(e) => setTempMinutes(Number(e.target.value))}
                        className="flex-1 px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value={15}>15 دقيقة</option>
                        <option value={30}>30 دقيقة</option>
                        <option value={60}>ساعة</option>
                        <option value={120}>ساعتين</option>
                      </select>
                      <button
                        onClick={handleTempPrivacy}
                        className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        تفعيل
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* === Detection Tab === */}
          {activeTab === 'detection' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">حساسية الكشف</label>
              <div className="space-y-1.5">
                {[
                  { value: 'strict', label: 'صارم', desc: 'يكشف أكثر لكن قد يعطي إنذارات كاذبة' },
                  { value: 'balanced', label: 'متوازن', desc: 'التوازن الأفضل بين الدقة والحساسية' },
                  { value: 'relaxed', label: 'مرن', desc: 'يقلل الإنذارات الكاذبة' },
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors border focus-within:ring-2 focus-within:ring-primary-500 ${sensitivity === opt.value ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                    <input type="radio" name="sensitivity" value={opt.value} checked={sensitivity === opt.value} onChange={() => setSensitivity(opt.value)} className="mt-1 accent-primary-600" />
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{opt.label}</span>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* === Shortcuts Tab === */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">اختصارات لوحة المفاتيح</label>
              <div className="space-y-2 text-sm">
                {[
                  { keys: 'Ctrl + Enter', action: 'بدء التحليل' },
                  { keys: 'Ctrl + Shift + V', action: 'لصق وتحليل' },
                  { keys: 'Escape', action: 'رجوع / إغلاق' },
                  { keys: 'F11', action: 'وضع العرض التقديمي' },
                ].map((s) => (
                  <div key={s.keys} className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <span className="text-slate-500 dark:text-slate-400">{s.action}</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono text-slate-600 dark:text-slate-400">{s.keys}</kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === Data Tab === */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <p>البيانات المحفوظة محلياً في متصفحك:</p>
                <ul className="list-disc list-inside space-y-0.5 mr-2">
                  <li>سجل التحليلات</li>
                  <li>النتائج المؤقتة (كاش)</li>
                  <li>ملاحظات المستخدم</li>
                  <li>إعدادات الحساسية والمظهر</li>
                </ul>
              </div>

              {/* #13 — Delete confirmation */}
              {showDeleteConfirm ? (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-bold text-red-700 dark:text-red-400">تأكيد الحذف</p>
                  <p className="text-xs text-red-600 dark:text-red-400">سيُحذف كل السجل والنتائج المحفوظة والملاحظات نهائياً. لا يمكن التراجع عن هذا الإجراء.</p>
                  <div className="flex gap-2">
                    <button onClick={handleClearData} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500">
                      نعم، احذف الكل
                    </button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500">
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowDeleteConfirm(true)} className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-1">
                  مسح جميع البيانات المحفوظة
                </button>
              )}
            </div>
          )}

          <div className="text-center text-xs text-slate-300 dark:text-slate-600 pt-2">الإصدار 2.1.0</div>
        </div>
      </div>
    </>
  )
}

export default SettingsPanel
