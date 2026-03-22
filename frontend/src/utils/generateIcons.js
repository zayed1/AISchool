// Generate PWA icons as data URLs (fallback if no physical icon files)
export function generateIconDataUrl(size) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = '#2563eb'
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, size * 0.15)
  ctx.fill()

  // Checkmark circle
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.3
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = size * 0.05
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, 2 * Math.PI)
  ctx.stroke()

  // Checkmark
  ctx.lineWidth = size * 0.06
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.4, cy)
  ctx.lineTo(cx - r * 0.05, cy + r * 0.35)
  ctx.lineTo(cx + r * 0.45, cy - r * 0.35)
  ctx.stroke()

  return canvas.toDataURL('image/png')
}
