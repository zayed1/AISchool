import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'

function SettingsPanel({ isOpen, onClose }) {
  const { dark, toggleTheme } = useTheme()
  const [sensitivity, setSensitivity] = useState(() => {
    try { return localStorage.getItem('detection_sensitivity') || 'balanced' } catch { return 'balanced' }
  })
  const [privacyMode, setPrivacyMode] = useState(() => {
    try { return localStorage.getItem('privacy_mode') === 'true' } catch { return false }
  })

  useEffect(() => { localStorage.setItem('detection_sensitivity', sensitivity) }, [sensitivity])
  useEffect(() => { localStorage.setItem('privacy_mode', String(privacyMode)) }, [privacyMode])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 transition-opacity" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-slate-800 shadow-2xl z-50 transition-transform duration-300 overflow-y-auto" dir="rtl">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">الإعدادات</h2>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" aria-label="إغلاق">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">المظهر</label>
            <div className="flex gap-2">
              <button onClick={() => { if (dark) toggleTheme() }} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${!dark ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>فاتح</button>
              <button onClick={() => { if (!dark) toggleTheme() }} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${dark ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>داكن</button>
            </div>
          </div>

          {/* Privacy mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">وضع الخصوصية</label>
                <p className="text-xs text-slate-400 dark:text-slate-500">لا يحفظ أي بيانات محلياً</p>
              </div>
              <button
                onClick={() => setPrivacyMode(!privacyMode)}
                className={`relative w-11 h-6 rounded-full transition-colors ${privacyMode ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${privacyMode ? 'right-0.5' : 'right-5'}`} />
              </button>
            </div>
            {privacyMode && (
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-2 text-xs text-primary-700 dark:text-primary-400">
                مفعّل: لن يتم حفظ السجل أو النتائج المؤقتة. تُمسح البيانات عند إغلاق المتصفح.
              </div>
            )}
          </div>

          {/* Sensitivity */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">حساسية الكشف</label>
            <div className="space-y-1.5">
              {[
                { value: 'strict', label: 'صارم', desc: 'يكشف أكثر لكن قد يعطي إنذارات كاذبة' },
                { value: 'balanced', label: 'متوازن', desc: 'التوازن الأفضل بين الدقة والحساسية' },
                { value: 'relaxed', label: 'مرن', desc: 'يقلل الإنذارات الكاذبة' },
              ].map((opt) => (
                <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${sensitivity === opt.value ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                  <input type="radio" name="sensitivity" value={opt.value} checked={sensitivity === opt.value} onChange={() => setSensitivity(opt.value)} className="mt-1 accent-primary-600" />
                  <div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{opt.label}</span>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Shortcuts */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">اختصارات لوحة المفاتيح</label>
            <div className="space-y-2 text-sm">
              {[{ keys: 'Ctrl + Enter', action: 'بدء التحليل' },{ keys: 'Ctrl + Shift + V', action: 'لصق وتحليل' },{ keys: 'Escape', action: 'رجوع / إغلاق' }].map((s) => (
                <div key={s.keys} className="flex justify-between items-center py-1">
                  <span className="text-slate-500 dark:text-slate-400">{s.action}</span>
                  <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono text-slate-600 dark:text-slate-400">{s.keys}</kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Clear data */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <button onClick={() => { localStorage.removeItem('analysis_history'); localStorage.removeItem('analysis_cache'); onClose() }} className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors">
              مسح جميع البيانات المحفوظة
            </button>
          </div>

          <div className="text-center text-xs text-slate-300 dark:text-slate-600 pt-2">الإصدار 2.0.0</div>
        </div>
      </div>
    </>
  )
}

export default SettingsPanel
