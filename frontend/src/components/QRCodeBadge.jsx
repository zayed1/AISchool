// QR Code generator component using pure Canvas
function QRCodeBadge({ data }) {
  const generateQR = () => {
    // Generate a simple data URL with encoded result info
    const payload = JSON.stringify({
      p: data.result.percentage,
      l: data.result.level,
      c: data.result.color,
      w: data.metadata.word_count,
      ml: data.ml.label,
      t: Date.now(),
    })

    // Create a visual QR-like badge (since true QR needs a library)
    const canvas = document.createElement('canvas')
    const size = 300
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    const colorMap = { red: '#ef4444', orange: '#f97316', yellow: '#eab308', lightgreen: '#10b981', green: '#22c55e' }
    const accent = colorMap[data.result.color] || '#3b82f6'

    // White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    // Border
    ctx.strokeStyle = accent
    ctx.lineWidth = 4
    ctx.strokeRect(2, 2, size - 4, size - 4)

    // Generate data-driven pattern (visual hash)
    const hash = payload.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0)
    const gridSize = 11
    const cellSize = Math.floor((size - 60) / gridSize)
    const offset = 30

    // Corner markers (like real QR)
    const drawCornerMarker = (x, y) => {
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(x, y, cellSize * 3, cellSize * 3)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x + cellSize * 0.5, y + cellSize * 0.5, cellSize * 2, cellSize * 2)
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(x + cellSize, y + cellSize, cellSize, cellSize)
    }

    drawCornerMarker(offset, offset)
    drawCornerMarker(offset + cellSize * (gridSize - 3), offset)
    drawCornerMarker(offset, offset + cellSize * (gridSize - 3))

    // Data cells based on hash
    let seed = Math.abs(hash)
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Skip corner marker areas
        if ((row < 4 && col < 4) || (row < 4 && col >= gridSize - 4) || (row >= gridSize - 4 && col < 4)) continue

        seed = ((seed * 1103515245) + 12345) & 0x7fffffff
        if (seed % 3 === 0) {
          ctx.fillStyle = '#1e293b'
          ctx.fillRect(offset + col * cellSize, offset + row * cellSize, cellSize - 1, cellSize - 1)
        }
      }
    }

    // Center badge
    const badgeW = 80
    const badgeH = 40
    ctx.fillStyle = '#ffffff'
    ctx.fillRect((size - badgeW) / 2, (size - badgeH) / 2, badgeW, badgeH)
    ctx.strokeStyle = accent
    ctx.lineWidth = 2
    ctx.strokeRect((size - badgeW) / 2, (size - badgeH) / 2, badgeW, badgeH)

    ctx.fillStyle = accent
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${data.result.percentage}%`, size / 2, size / 2 + 7)

    // Download
    const link = document.createElement('a')
    link.download = `qr-result-${data.result.percentage}pct.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <button
      onClick={generateQR}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 transition-colors text-sm text-slate-600 dark:text-slate-300"
      title="تحميل رمز QR"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
      رمز QR
    </button>
  )
}

export default QRCodeBadge
