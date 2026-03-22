// #9 — Export report as PNG using html2canvas-like approach (pure canvas)
export function exportReportAsPNG(data) {
  const { result, statistical, ml, metadata } = data
  const canvas = document.createElement('canvas')
  const dpr = window.devicePixelRatio || 1
  const w = 600
  const h = 400
  canvas.width = w * dpr
  canvas.height = h * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  // Background
  ctx.fillStyle = '#ffffff'
  ctx.roundRect(0, 0, w, h, 16)
  ctx.fill()

  // Border
  const colorMap = { red: '#ef4444', orange: '#f97316', yellow: '#eab308', lightgreen: '#10b981', green: '#22c55e' }
  const accentColor = colorMap[result.color] || '#3b82f6'
  ctx.strokeStyle = accentColor
  ctx.lineWidth = 3
  ctx.roundRect(0, 0, w, h, 16)
  ctx.stroke()

  // Top accent bar
  ctx.fillStyle = accentColor
  ctx.fillRect(0, 0, w, 6)

  // Title
  ctx.fillStyle = '#1e293b'
  ctx.font = 'bold 18px IBM Plex Sans Arabic, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('كاشف النصوص المولدة بالذكاء الاصطناعي', w / 2, 40)

  // Big percentage circle
  const cx = w / 2, cy = 130, r = 55
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, 2 * Math.PI)
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 8
  ctx.stroke()

  // Percentage arc
  ctx.beginPath()
  const startAngle = -Math.PI / 2
  const endAngle = startAngle + (result.percentage / 100) * 2 * Math.PI
  ctx.arc(cx, cy, r, startAngle, endAngle)
  ctx.strokeStyle = accentColor
  ctx.lineWidth = 8
  ctx.lineCap = 'round'
  ctx.stroke()

  // Percentage text
  ctx.fillStyle = accentColor
  ctx.font = 'bold 32px IBM Plex Sans Arabic, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${result.percentage}%`, cx, cy + 10)

  // Level text
  ctx.fillStyle = '#475569'
  ctx.font = 'bold 14px IBM Plex Sans Arabic, sans-serif'
  ctx.fillText(result.level, cx, cy + r + 25)

  // Stats row
  const statsY = 240
  const stats = [
    { label: 'عدد الكلمات', value: metadata.word_count },
    { label: 'النموذج', value: ml.label.toUpperCase() === 'AI' ? 'ذكاء اصطناعي' : 'بشري' },
    { label: 'الثقة', value: `${Math.round(ml.confidence * 100)}%` },
    { label: 'عدد الجمل', value: metadata.sentence_count },
  ]

  ctx.font = '11px IBM Plex Sans Arabic, sans-serif'
  stats.forEach((stat, i) => {
    const sx = (w / 4) * i + w / 8
    ctx.fillStyle = '#94a3b8'
    ctx.fillText(stat.label, sx, statsY)
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 16px IBM Plex Sans Arabic, sans-serif'
    ctx.fillText(String(stat.value), sx, statsY + 22)
    ctx.font = '11px IBM Plex Sans Arabic, sans-serif'
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

  const barY = 290
  const barW = (w - 80) / indicators.length - 8
  indicators.forEach((ind, i) => {
    const bx = w - 40 - (i + 1) * (barW + 8) + barW
    // Label
    ctx.fillStyle = '#94a3b8'
    ctx.font = '9px IBM Plex Sans Arabic, sans-serif'
    ctx.fillText(ind.label, bx + barW / 2, barY)
    // Bar bg
    ctx.fillStyle = '#e2e8f0'
    ctx.fillRect(bx, barY + 8, barW, 8)
    // Bar fill
    ctx.fillStyle = ind.pct >= 70 ? '#f87171' : ind.pct >= 40 ? '#facc15' : '#4ade80'
    ctx.fillRect(bx, barY + 8, barW * (ind.pct / 100), 8)
    // Pct
    ctx.fillStyle = '#64748b'
    ctx.font = '9px IBM Plex Sans Arabic, sans-serif'
    ctx.fillText(`${ind.pct}%`, bx + barW / 2, barY + 28)
  })

  // Footer
  ctx.fillStyle = '#cbd5e1'
  ctx.font = '10px IBM Plex Sans Arabic, sans-serif'
  ctx.fillText('هذه النتائج تقديرية وليست قاطعة', w / 2, h - 20)

  // Download
  const link = document.createElement('a')
  link.download = `ai-detection-${result.percentage}pct.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}
