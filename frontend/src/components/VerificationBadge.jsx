// #20 — Downloadable verification badge
function VerificationBadge({ result }) {
  const generateBadge = () => {
    const canvas = document.createElement('canvas')
    const dpr = 2
    const w = 300
    const h = 100
    canvas.width = w * dpr
    canvas.height = h * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const colorMap = { red: '#ef4444', orange: '#f97316', yellow: '#eab308', lightgreen: '#10b981', green: '#22c55e' }
    const bgMap = { red: '#fef2f2', orange: '#fff7ed', yellow: '#fefce8', lightgreen: '#ecfdf5', green: '#f0fdf4' }
    const accent = colorMap[result.color] || '#3b82f6'
    const bg = bgMap[result.color] || '#eff6ff'

    // Background
    ctx.fillStyle = bg
    ctx.beginPath()
    ctx.roundRect(0, 0, w, h, 12)
    ctx.fill()

    // Border
    ctx.strokeStyle = accent
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(0, 0, w, h, 12)
    ctx.stroke()

    // Icon
    ctx.fillStyle = accent
    ctx.beginPath()
    ctx.arc(35, h / 2, 18, 0, 2 * Math.PI)
    ctx.fill()

    // Checkmark or X in circle
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (result.percentage <= 40) {
      // Checkmark
      ctx.beginPath()
      ctx.moveTo(27, h / 2)
      ctx.lineTo(33, h / 2 + 6)
      ctx.lineTo(43, h / 2 - 6)
      ctx.stroke()
    } else {
      // Warning
      ctx.font = 'bold 18px sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.fillText('!', 35, h / 2 + 6)
    }

    // Text
    ctx.textAlign = 'right'
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 13px IBM Plex Sans Arabic, sans-serif'
    ctx.fillText('كاشف النصوص المولدة بالذكاء الاصطناعي', w - 15, 30)

    ctx.fillStyle = accent
    ctx.font = 'bold 20px IBM Plex Sans Arabic, sans-serif'
    ctx.fillText(`${result.percentage}%`, w - 15, 58)

    ctx.fillStyle = '#64748b'
    ctx.font = '11px IBM Plex Sans Arabic, sans-serif'
    ctx.fillText(result.level, w - 15, 78)

    // Date
    ctx.fillStyle = '#cbd5e1'
    ctx.font = '9px IBM Plex Sans Arabic, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(new Date().toLocaleDateString('ar-EG'), 65, 78)

    // Download
    const link = document.createElement('a')
    link.download = `verification-badge-${result.percentage}pct.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <button
      onClick={generateBadge}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 transition-colors text-sm text-slate-600 dark:text-slate-300"
      title="تحميل شارة التحقق"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
      تحميل شارة التحقق
    </button>
  )
}

export default VerificationBadge
