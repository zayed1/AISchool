// #99 — Referral program — share link, track referrals, earn bonus analyses
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

function ReferralProgram() {
  const { isAuthenticated, user } = useAuth()
  const { addToast } = useToast()
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState({ referrals: 0, bonus: 0 })

  // Generate referral link from user ID
  const referralCode = user?.id?.slice(0, 8) || ''
  const referralLink = referralCode ? `${window.location.origin}?ref=${referralCode}` : ''

  // Load referral stats from localStorage
  useEffect(() => {
    if (!referralCode) return
    try {
      const saved = localStorage.getItem(`referral_stats_${referralCode}`)
      if (saved) setStats(JSON.parse(saved))
    } catch {}
  }, [referralCode])

  // Track incoming referral
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref && ref !== referralCode) {
      localStorage.setItem('referred_by', ref)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [referralCode])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      addToast('تم نسخ رابط الإحالة!', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'كاشف النصوص العربية المولدة بالذكاء الاصطناعي',
          text: 'جرب هذه الأداة لكشف النصوص المولدة بالذكاء الاصطناعي — احصل على 5 تحليلات مجانية إضافية عند التسجيل!',
          url: referralLink,
        })
      } catch {}
    } else {
      handleCopy()
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/10 dark:to-blue-900/10 rounded-xl border border-primary-200 dark:border-primary-800 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">ادعُ صديقاً واحصل على مميزات إضافية</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">شارك رابطك → صديقك يسجل → كلاكما يحصل على 5 تحليلات مجانية إضافية</p>

          {/* Stats */}
          {stats.referrals > 0 && (
            <div className="flex gap-4 mt-2">
              <div className="text-center">
                <span className="text-lg font-bold text-primary-600 dark:text-primary-400">{stats.referrals}</span>
                <p className="text-[10px] text-slate-400">إحالات</p>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-green-600 dark:text-green-400">+{stats.bonus}</span>
                <p className="text-[10px] text-slate-400">تحليلات إضافية</p>
              </div>
            </div>
          )}

          {/* Link + actions */}
          <div className="flex gap-2 mt-3">
            <div className="flex-1 min-w-0 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 truncate font-mono" dir="ltr">
              {referralLink}
            </div>
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${copied ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
            >
              {copied ? 'تم النسخ' : 'نسخ'}
            </button>
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors shrink-0"
              aria-label="مشاركة"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReferralProgram
