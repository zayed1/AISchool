// #34 — Export report as shareable PNG card (social-media-ready)
export function exportReportAsPNG(data) {
  const { result, statistical, ml, metadata } = data
  const canvas = document.createElement('canvas')
  const dpr = window.devicePixelRatio || 2
  const w = 600
  const h = 420
  canvas.width = w * dpr
  canvas.height = h * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const colorMap = {
    red: { accent: '#ef4444', bg: '#fef2f2', light: '#fee2e2' },
    orange: { accent: '#f97316', bg: '#fff7ed', light: '#ffedd5' },
    yellow: { accent: '#eab308', bg: '#fefce8', light: '#fef9c3' },
    lightgreen: { accent: '#10b981', bg: '#ecfdf5', light: '#d1fae5' },
    green: { accent: '#22c55e', bg: '#f0fdf4', light: '#dcfce7' },
  }
  const c = colorMap[result.color] || colorMap.yellow

  // Background with subtle gradient
  const bgGrad = ctx.createLinearGradient(0, 0, w, h)
  bgGrad.addColorStop(0, '#ffffff')
  bgGrad.addColorStop(1, c.bg)
  ctx.fillStyle = bgGrad
  roundRect(ctx, 0, 0, w, h, 16)
  ctx.fill()

  // Border
  ctx.strokeStyle = c.accent + '40'
  ctx.lineWidth = 2
  roundRect(ctx, 0, 0, w, h, 16)
  ctx.stroke()

  // Top accent bar with gradient
  const barGrad = ctx.createLinearGradient(0, 0, w, 0)
  barGrad.addColorStop(0, c.accent)
  barGrad.addColorStop(1, c.accent + '80')
  ctx.fillStyle = barGrad
  roundRect(ctx, 0, 0, w, 5, [16, 16, 0, 0])
  ctx.fill()

  // Logo area
  ctx.fillStyle = c.accent
  roundRect(ctx, w - 52, 18, 36, 36, 8)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 18px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('AI', w - 34, 42)

  // Title
  ctx.fillStyle = '#1e293b'
  ctx.font = 'bold 17px IBM Plex Sans Arabic, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('كاشف النصوص المولدة بالذكاء الاصطناعي', w - 60, 34)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '11px IBM Plex Sans Arabic, sans-serif'
  ctx.fillText('تقرير التحليل', w - 60, 50)

  // Divider
  ctx.fillStyle = '#e2e8f0'
  ctx.fillRect(20, 62, w - 40, 1)

  // Big percentage circle
  const cx = w / 2, cy = 150, r = 58
  // Circle bg
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, 2 * Math.PI)
  ctx.fillStyle = c.light
  ctx.fill()
  // Circle border
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, 2 * Math.PI)
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 7
  ctx.stroke()
  // Percentage arc
  ctx.beginPath()
  const startAngle = -Math.PI / 2
  const endAngle = startAngle + (result.percentage / 100) * 2 * Math.PI
  ctx.arc(cx, cy, r, startAngle, endAngle)
  ctx.strokeStyle = c.accent
  ctx.lineWidth = 7
  ctx.lineCap = 'round'
  ctx.stroke()

  // Percentage text
  ctx.fillStyle = c.accent
  ctx.font = 'bold 36px IBM Plex Sans Arabic, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${result.percentage}%`, cx, cy + 12)

  // Level text
  ctx.fillStyle = '#475569'
  ctx.font = 'bold 14px IBM Plex Sans Arabic, sans-serif'
  ctx.fillText(result.level, cx, cy + r + 28)

  // Stats row
  const statsY = 252
  const stats = [
    { label: 'الكلمات', value: String(metadata.word_count) },
    { label: 'الجمل', value: String(metadata.sentence_count) },
    { label: 'النموذج', value: ml.label.toUpperCase() === 'AI' ? 'AI' : 'بشري' },
    { label: 'الثقة', value: `${Math.round(ml.confidence * 100)}%` },
  ]

  const boxW = (w - 80) / 4
  stats.forEach((stat, i) => {
    const bx = w - 40 - (i + 1) * (boxW + 8) + boxW + 4
    // Box bg
    ctx.fillStyle = '#f8fafc'
    roundRect(ctx, bx, statsY, boxW, 50, 8)
    ctx.fill()
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1
    roundRect(ctx, bx, statsY, boxW, 50, 8)
    ctx.stroke()
    // Label
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px IBM Plex Sans Arabic, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(stat.label, bx + boxW / 2, statsY + 16)
    // Value
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 16px IBM Plex Sans Arabic, sans-serif'
    ctx.fillText(stat.value, bx + boxW / 2, statsY + 38)
  })

  // Indicator mini-bars
  const indicators = [
    { label: 'المفردات', pct: Math.min(Math.round(statistical.ttr * 100), 100) },
    { label: 'التباين', pct: Math.min(Math.round(statistical.sentence_length_cv * 100), 100) },
    { label: 'التكرار', pct: Math.min(Math.round(statistical.repetitive_openers_ratio * 200), 100) },
    { label: 'الربط', pct: Math.min(Math.round((statistical.connector_density / 4) * 100), 100) },
    { label: 'الأخطاء', pct: Math.min(Math.round((statistical.error_ratio / 0.05) * 100), 100) },
    { label: 'الانفجارية', pct: Math.min(Math.round(statistical.burstiness * 100), 100) },
  ]

  const barY = 325
  const barW = (w - 80) / indicators.length - 6
  indicators.forEach((ind, i) => {
    const bx = w - 40 - (i + 1) * (barW + 6) + barW
    // Label
    ctx.fillStyle = '#94a3b8'
    ctx.font = '9px IBM Plex Sans Arabic, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(ind.label, bx + barW / 2, barY)
    // Bar bg
    ctx.fillStyle = '#e2e8f0'
    roundRect(ctx, bx, barY + 6, barW, 8, 4)
    ctx.fill()
    // Bar fill
    ctx.fillStyle = ind.pct >= 70 ? '#f87171' : ind.pct >= 40 ? '#facc15' : '#4ade80'
    if (ind.pct > 0) {
      roundRect(ctx, bx, barY + 6, barW * (ind.pct / 100), 8, 4)
      ctx.fill()
    }
    // Pct
    ctx.fillStyle = '#64748b'
    ctx.font = 'bold 9px IBM Plex Sans Arabic, sans-serif'
    ctx.fillText(`${ind.pct}%`, bx + barW / 2, barY + 28)
  })

  // Footer divider
  ctx.fillStyle = '#f1f5f9'
  ctx.fillRect(20, h - 45, w - 40, 1)

  // Footer
  ctx.fillStyle = '#cbd5e1'
  ctx.font = '10px IBM Plex Sans Arabic, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('هذه النتائج تقديرية وليست قاطعة · كاشف النصوص العربية المولدة بالذكاء الاصطناعي', w / 2, h - 18)

  // Download
  const link = document.createElement('a')
  link.download = `ai-detection-${result.percentage}pct.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

// #34 — Share as social image (copies to clipboard if possible, else downloads)
export async function shareReportAsImage(data) {
  const { result, statistical, ml, metadata } = data
  const canvas = document.createElement('canvas')
  const dpr = 2
  const w = 540
  const h = 300
  canvas.width = w * dpr
  canvas.height = h * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const colorMap = {
    red: { accent: '#ef4444', gradEnd: '#fecaca' },
    orange: { accent: '#f97316', gradEnd: '#fed7aa' },
    yellow: { accent: '#eab308', gradEnd: '#fef08a' },
    lightgreen: { accent: '#10b981', gradEnd: '#a7f3d0' },
    green: { accent: '#22c55e', gradEnd: '#bbf7d0' },
  }
  const c = colorMap[result.color] || colorMap.yellow

  // Gradient background
  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, '#1e293b')
  bg.addColorStop(1, '#334155')
  roundRect(ctx, 0, 0, w, h, 20)
  ctx.fillStyle = bg
  ctx.fill()

  // Accent glow
  const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 200)
  glow.addColorStop(0, c.accent + '15')
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  // Logo badge
  ctx.fillStyle = c.accent
  roundRect(ctx, w - 52, 16, 36, 36, 10)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 16px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('AI', w - 34, 40)

  // Title
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 15px IBM Plex Sans Arabic, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('كاشف النصوص المولدة بالذكاء الاصطناعي', w - 60, 32)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '11px IBM Plex Sans Arabic, sans-serif'
  ctx.fillText('نتيجة التحليل', w - 60, 48)

  // Circle
  const cx2 = w / 2, cy2 = 140, r2 = 52
  ctx.beginPath()
  ctx.arc(cx2, cy2, r2, 0, 2 * Math.PI)
  ctx.strokeStyle = '#475569'
  ctx.lineWidth = 6
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx2, cy2, r2, -Math.PI / 2, -Math.PI / 2 + (result.percentage / 100) * 2 * Math.PI)
  ctx.strokeStyle = c.accent
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 32px IBM Plex Sans Arabic, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${result.percentage}%`, cx2, cy2 + 10)

  ctx.fillStyle = c.accent
  ctx.font = 'bold 13px IBM Plex Sans Arabic, sans-serif'
  ctx.fillText(result.level, cx2, cy2 + r2 + 22)

  // Bottom stats
  const sy = h - 55
  const items = [
    `${metadata.word_count} كلمة`,
    `${metadata.sentence_count} جملة`,
    `${ml.label.toUpperCase() === 'AI' ? 'AI' : 'بشري'} (${Math.round(ml.confidence * 100)}%)`,
  ]
  ctx.fillStyle = '#64748b'
  ctx.font = '11px IBM Plex Sans Arabic, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(items.join('  ·  '), w / 2, sy)

  ctx.fillStyle = '#475569'
  ctx.font = '9px IBM Plex Sans Arabic, sans-serif'
  ctx.fillText('هذه النتائج تقديرية وليست قاطعة', w / 2, h - 16)

  // Try to copy to clipboard, fallback to download
  try {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      return { copied: true }
    }
  } catch {}

  // Fallback: download
  const link = document.createElement('a')
  link.download = `ai-check-${result.percentage}pct.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
  return { copied: false }
}

// Helper: roundRect that works in all browsers
function roundRect(ctx, x, y, w, h, r) {
  if (typeof r === 'number') r = [r, r, r, r]
  ctx.beginPath()
  ctx.moveTo(x + r[0], y)
  ctx.lineTo(x + w - r[1], y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r[1])
  ctx.lineTo(x + w, y + h - r[2])
  ctx.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h)
  ctx.lineTo(x + r[3], y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r[3])
  ctx.lineTo(x, y + r[0])
  ctx.quadraticCurveTo(x, y, x + r[0], y)
  ctx.closePath()
}
