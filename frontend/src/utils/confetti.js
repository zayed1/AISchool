// #37 — Enhanced confetti with burst patterns
export function launchConfetti(intensity = 'normal') {
  // Respect reduced motion
  if (typeof window !== 'undefined' &&
    (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ||
     localStorage.getItem('reduced_motion') === 'true')) {
    return
  }

  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;pointer-events:none'
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const colors = intensity === 'strong'
    ? ['#22c55e', '#16a34a', '#4ade80', '#86efac', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#ec4899']
    : ['#22c55e', '#16a34a', '#4ade80', '#86efac', '#3b82f6', '#f59e0b']

  const particleCount = intensity === 'strong' ? 150 : intensity === 'light' ? 50 : 100
  const particles = []

  // Create particles from multiple burst points for more dynamic feel
  const burstPoints = intensity === 'strong'
    ? [{ x: canvas.width * 0.3, y: canvas.height * 0.4 }, { x: canvas.width * 0.7, y: canvas.height * 0.4 }, { x: canvas.width * 0.5, y: canvas.height * 0.3 }]
    : [{ x: canvas.width * 0.5, y: canvas.height * 0.4 }]

  for (let i = 0; i < particleCount; i++) {
    const burst = burstPoints[i % burstPoints.length]
    const shape = Math.random() > 0.5 ? 'rect' : 'circle'
    particles.push({
      x: burst.x + (Math.random() - 0.5) * 200,
      y: burst.y,
      vx: (Math.random() - 0.5) * (intensity === 'strong' ? 20 : 15),
      vy: -Math.random() * (intensity === 'strong' ? 20 : 15) - 5,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      opacity: 1,
      shape,
    })
  }

  let frame = 0
  const maxFrames = intensity === 'strong' ? 160 : 120

  function animate() {
    frame++
    if (frame > maxFrames) {
      canvas.remove()
      return
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    particles.forEach((p) => {
      p.x += p.vx
      p.vy += 0.3
      p.y += p.vy
      p.vx *= 0.99
      p.rotation += p.rotationSpeed
      p.opacity = Math.max(0, 1 - frame / maxFrames)

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.globalAlpha = p.opacity
      ctx.fillStyle = p.color

      if (p.shape === 'circle') {
        ctx.beginPath()
        ctx.arc(0, 0, p.w / 2, 0, 2 * Math.PI)
        ctx.fill()
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      }

      ctx.restore()
    })

    requestAnimationFrame(animate)
  }

  requestAnimationFrame(animate)
}
