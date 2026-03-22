// Admin Dashboard — platform overview and management
import { useState, useEffect, useMemo } from 'react'

// Simulated admin data from localStorage scans
function getAdminData() {
  try {
    const history = JSON.parse(localStorage.getItem('analysis_history') || '[]')
    const rateData = JSON.parse(localStorage.getItem('rate_limit') || '{"timestamps":[]}')

    const today = new Date()
    const todayStr = today.toLocaleDateString('ar-EG')

    // Aggregate stats
    const totalScans = history.length
    const todayScans = rateData.timestamps.filter((t) => {
      const d = new Date(t)
      return d.toDateString() === today.toDateString()
    }).length

    const avgScore = totalScans > 0
      ? Math.round(history.reduce((s, h) => s + (h.result?.percentage || 0), 0) / totalScans)
      : 0

    const aiDetected = history.filter((h) => (h.result?.percentage || 0) >= 50).length
    const humanDetected = totalScans - aiDetected

    // Score distribution
    const distribution = { green: 0, lightgreen: 0, yellow: 0, orange: 0, red: 0 }
    history.forEach((h) => {
      const color = h.result?.color
      if (color && distribution[color] !== undefined) distribution[color]++
    })

    // Recent scans
    const recentScans = history.slice(0, 10).map((h) => ({
      preview: h.preview || 'نص...',
      percentage: h.result?.percentage || 0,
      color: h.result?.color || 'yellow',
      date: h.date || '',
      words: h.metadata?.word_count || 0,
    }))

    // Average word count
    const avgWords = totalScans > 0
      ? Math.round(history.reduce((s, h) => s + (h.metadata?.word_count || 0), 0) / totalScans)
      : 0

    return {
      totalScans, todayScans, avgScore, aiDetected, humanDetected,
      distribution, recentScans, avgWords,
    }
  } catch {
    return {
      totalScans: 0, todayScans: 0, avgScore: 0, aiDetected: 0, humanDetected: 0,
      distribution: { green: 0, lightgreen: 0, yellow: 0, orange: 0, red: 0 },
      recentScans: [], avgWords: 0,
    }
  }
}

function AdminDashboard({ onClose }) {
  const [data, setData] = useState(null)
  const [adminPass, setAdminPass] = useState('')
  const [authenticated, setAuthenticated] = useState(false)

  // Simple admin auth (demo — in production use proper auth)
  const [serverStats, setServerStats] = useState(null)
  const [thresholdAlert, setThresholdAlert] = useState(false)

  const handleLogin = () => {
    if (adminPass === 'admin123') {
      setAuthenticated(true)
      setData(getAdminData())
      fetchServerStats()
    }
  }

  const fetchServerStats = async () => {
    try {
      const [healthRes, statsRes] = await Promise.all([
        fetch('/api/health').then((r) => r.json()).catch(() => null),
        fetch('/api/admin/stats').then((r) => r.json()).catch(() => null),
      ])
      setServerStats({ health: healthRes, stats: statsRes })

      // #19 — Threshold alert: check if >60% of recent scans are AI
      if (statsRes?.ai_count && statsRes?.total_scans) {
        const aiRatio = statsRes.ai_count / statsRes.total_scans
        setThresholdAlert(aiRatio > 0.6 && statsRes.total_scans >= 5)
      }
    } catch {}
  }

  const handleServerExport = async () => {
    try {
      const res = await fetch('/api/admin/export')
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'admin-export.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }

  const refreshData = () => { setData(getAdminData()); fetchServerStats() }

  const colorDot = { red: 'bg-red-400', orange: 'bg-orange-400', yellow: 'bg-yellow-400', lightgreen: 'bg-emerald-400', green: 'bg-green-400' }
  const colorLabel = { green: 'بشري', lightgreen: 'غالباً بشري', yellow: 'غير واضح', orange: 'مشبوه', red: 'AI مرجح' }

  if (!authenticated) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">لوحة تحكم المشرف</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="max-w-sm mx-auto space-y-4 py-12">
          <div className="w-16 h-16 mx-auto bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">أدخل كلمة مرور المشرف</p>
          <input
            type="password"
            value={adminPass}
            onChange={(e) => setAdminPass(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="كلمة المرور"
            className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-center bg-white dark:bg-slate-800 dark:text-slate-100 outline-none focus:border-primary-500"
            dir="ltr"
          />
          <button onClick={handleLogin} className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors">
            دخول
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">لوحة تحكم المشرف</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">نظرة عامة على استخدام المنصة</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refreshData} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="تحديث">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي التحليلات', value: data.totalScans, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/10' },
          { label: 'تحليلات اليوم', value: data.todayScans, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
          { label: 'متوسط AI %', value: `${data.avgScore}%`, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/10' },
          { label: 'متوسط الكلمات', value: data.avgWords, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/10' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center border border-slate-100 dark:border-slate-700`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Distribution */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">توزيع النتائج</h3>
        <div className="space-y-2">
          {Object.entries(data.distribution).reverse().map(([color, count]) => {
            const pct = data.totalScans > 0 ? Math.round((count / data.totalScans) * 100) : 0
            return (
              <div key={color} className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${colorDot[color]} shrink-0`} />
                <span className="text-xs text-slate-500 dark:text-slate-400 w-24">{colorLabel[color]}</span>
                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${colorDot[color]} transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 w-12 text-left">{count} ({pct}%)</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* AI vs Human */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800 p-4 text-center">
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{data.aiDetected}</p>
          <p className="text-xs text-red-500 mt-1">نصوص AI مكتشفة</p>
          <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">
            {data.totalScans > 0 ? Math.round((data.aiDetected / data.totalScans) * 100) : 0}%
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-800 p-4 text-center">
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{data.humanDetected}</p>
          <p className="text-xs text-green-500 mt-1">نصوص بشرية</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
            {data.totalScans > 0 ? Math.round((data.humanDetected / data.totalScans) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Recent scans */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">آخر التحليلات</h3>
        {data.recentScans.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">لا توجد تحليلات بعد</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.recentScans.map((scan, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-slate-50 dark:border-slate-700 last:border-0">
                <span className={`w-2.5 h-2.5 rounded-full ${colorDot[scan.color]} shrink-0`} />
                <span className="text-xs text-slate-600 dark:text-slate-400 truncate flex-1">{scan.preview}</span>
                <span className="text-xs font-bold text-slate-500">{scan.percentage}%</span>
                <span className="text-[10px] text-slate-400">{scan.words}ك</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* #19 — Threshold alert */}
      {thresholdAlert && (
        <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            <div>
              <p className="text-sm font-bold text-red-700 dark:text-red-400">تنبيه: نسبة مرتفعة من النصوص المشبوهة</p>
              <p className="text-xs text-red-600 dark:text-red-400">أكثر من 60% من التحليلات الأخيرة صُنّفت كنصوص AI</p>
            </div>
          </div>
        </div>
      )}

      {/* #17 — Server stats */}
      {serverStats && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">حالة الخادم</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            {serverStats.health && (
              <>
                <div><p className="font-bold text-green-500">{serverStats.health.status}</p><p className="text-slate-400">الحالة</p></div>
                <div><p className="font-bold text-slate-700 dark:text-slate-300">{Math.round(serverStats.health.uptime_seconds / 60)} د</p><p className="text-slate-400">وقت التشغيل</p></div>
                <div><p className="font-bold text-slate-700 dark:text-slate-300">{serverStats.health.total_analyses}</p><p className="text-slate-400">تحليلات</p></div>
                <div><p className="font-bold text-slate-700 dark:text-slate-300">{serverStats.health.memory_mb} MB</p><p className="text-slate-400">ذاكرة</p></div>
              </>
            )}
          </div>
          {serverStats.health?.avg_analysis_ms > 0 && (
            <p className="text-[10px] text-slate-400 mt-2 text-center">متوسط وقت التحليل: {serverStats.health.avg_analysis_ms} مل‌ث</p>
          )}
        </div>
      )}

      {/* Management actions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">إدارة</h3>
        <div className="space-y-2">
          <button onClick={handleServerExport} className="w-full py-2 text-sm text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 rounded-lg transition-colors text-right px-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            تصدير بيانات الخادم (JSON)
          </button>
          <button
            onClick={() => { localStorage.removeItem('analysis_history'); localStorage.removeItem('analysis_cache'); localStorage.removeItem('rate_limit'); refreshData() }}
            className="w-full py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors text-right px-3"
          >
            مسح جميع البيانات المحلية
          </button>
          <button
            onClick={() => { localStorage.removeItem('onboarding_completed'); refreshData() }}
            className="w-full py-2 text-sm text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 rounded-lg transition-colors text-right px-3"
          >
            إعادة تعيين الجولة التعريفية
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
