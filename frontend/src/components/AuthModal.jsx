import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

function AuthModal({ isOpen, onClose }) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const [mode, setMode] = useState('login') // login | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password)
        onClose()
      } else {
        await signUpWithEmail(email, password)
        setSuccess('تم إرسال رابط التأكيد إلى بريدك الإلكتروني')
      }
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('Invalid login')) setError('البريد أو كلمة المرور غير صحيحة')
      else if (msg.includes('already registered')) setError('هذا البريد مسجل بالفعل')
      else if (msg.includes('Password')) setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      else setError(msg || 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm animate-scale-in" dir="rtl" onClick={(e) => e.stopPropagation()}>
          <div className="p-6 space-y-4">
            {/* Header */}
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">للحصول على تحليلات أكثر ومميزات إضافية</p>
            </div>

            {/* Google login */}
            <button onClick={signInWithGoogle} className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              الدخول بحساب Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400">أو</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="البريد الإلكتروني"
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-sm dark:text-slate-200 outline-none focus:border-primary-500"
                dir="ltr"
              />
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                placeholder="كلمة المرور" minLength={6}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-sm dark:text-slate-200 outline-none focus:border-primary-500"
                dir="ltr"
              />

              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              {success && <p className="text-sm text-green-500 text-center">{success}</p>}

              <button type="submit" disabled={loading} className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white font-semibold rounded-xl transition-colors text-sm">
                {loading ? 'جارٍ...' : mode === 'login' ? 'دخول' : 'إنشاء حساب'}
              </button>
            </form>

            {/* Toggle mode */}
            <p className="text-center text-sm text-slate-500">
              {mode === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
              <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }} className="text-primary-600 dark:text-primary-400 font-medium mr-1 hover:underline">
                {mode === 'login' ? 'إنشاء حساب' : 'تسجيل الدخول'}
              </button>
            </p>
          </div>

          {/* Close */}
          <button onClick={onClose} className="absolute top-3 left-3 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" aria-label="إغلاق">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    </>
  )
}

export default AuthModal
