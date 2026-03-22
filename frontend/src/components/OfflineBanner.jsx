// #19 — Offline banner
import { useOnlineStatus } from '../hooks/useUtilities'

function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-amber-500 text-white py-2 px-4 text-center text-sm font-medium shadow-lg" dir="rtl">
      <div className="flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
        <span>لا يوجد اتصال بالإنترنت — التحليل غير متاح حالياً</span>
      </div>
    </div>
  )
}

export default OfflineBanner
