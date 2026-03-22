// #12 — Lightweight confetti effect (no external library)
export function launchConfetti() {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;pointer-events:none'
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const colors = ['#22c55e', '#16a34a', '#4ade80', '#86efac', '#3b82f6', '#f59e0b', '#ef4444']
  const particles = []

  for (let i = 0; i < 100; i++) {
    particles.push({
      x: canvas.width * 0.5 + (Math.random() - 0.5) * 200,
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 15,
      vy: -Math.random() * 15 - 5,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
    })
  }

  let frame = 0
  const maxFrames = 120

  function animate() {
    frame++
    if (frame > maxFrames) {
      canvas.remove()
      return
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    particles.forEach((p) => {
      p.x += p.vx
      p.vy += 0.3 // gravity
      p.y += p.vy
      p.vx *= 0.99
      p.rotation += p.rotationSpeed
      p.opacity = Math.max(0, 1 - frame / maxFrames)

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.globalAlpha = p.opacity
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    })

    requestAnimationFrame(animate)
  }

  requestAnimationFrame(animate)
}
