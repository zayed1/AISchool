// #9 — Radar chart for statistical indicators (pure SVG, no library)
import { useEffect, useState } from 'react'

const labels = [
  { key: 'ttr', label: 'تنوع المفردات', max: 1 },
  { key: 'sentence_length_cv', label: 'تباين الجمل', max: 1 },
  { key: 'repetitive_openers_ratio', label: 'التكرار', max: 0.5 },
  { key: 'connector_density', label: 'أدوات الربط', max: 4 },
  { key: 'error_ratio', label: 'الأخطاء', max: 0.05 },
  { key: 'burstiness', label: 'الانفجارية', max: 1 },
]

const cx = 150
const cy = 140
const R = 100

function polarToCart(angle, r) {
  const rad = (angle - 90) * (Math.PI / 180)
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function RadarChart({ statistical }) {
  const [animProgress, setAnimProgress] = useState(0)

  useEffect(() => {
    const start = performance.now()
    const duration = 800

    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1)
      setAnimProgress(1 - Math.pow(1 - t, 3))
      if (t < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [])

  const n = labels.length
  const angleStep = 360 / n

  // Background rings
  const rings = [0.25, 0.5, 0.75, 1]
  const ringPaths = rings.map((scale) => {
    const points = labels.map((_, i) => polarToCart(i * angleStep, R * scale))
    return points.map((p) => `${p.x},${p.y}`).join(' ')
  })

  // Axis lines
  const axes = labels.map((_, i) => polarToCart(i * angleStep, R))

  // Data polygon
  const dataPoints = labels.map((item, i) => {
    const normalized = Math.min(statistical[item.key] / item.max, 1)
    return polarToCart(i * angleStep, R * normalized * animProgress)
  })
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(' ')

  // Label positions
  const labelPositions = labels.map((item, i) => {
    const pos = polarToCart(i * angleStep, R + 20)
    return { ...pos, label: item.label }
  })

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">الرسم البياني العنكبوتي</h3>
      <div className="flex justify-center">
        <svg viewBox="0 0 300 290" className="w-full max-w-[320px]">
          {/* Grid rings */}
          {ringPaths.map((points, i) => (
            <polygon
              key={i}
              points={points}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="0.5"
              className="dark:stroke-slate-600"
            />
          ))}

          {/* Axes */}
          {axes.map((point, i) => (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={point.x}
              y2={point.y}
              stroke="#e2e8f0"
              strokeWidth="0.5"
              className="dark:stroke-slate-600"
            />
          ))}

          {/* Data polygon */}
          <polygon
            points={dataPath}
            fill="rgba(59, 130, 246, 0.2)"
            stroke="#3b82f6"
            strokeWidth="2"
            className="dark:fill-blue-500/20"
          />

          {/* Data points */}
          {dataPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" fill="#3b82f6" />
          ))}

          {/* Labels */}
          {labelPositions.map((pos, i) => (
            <text
              key={i}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[9px] fill-slate-500 dark:fill-slate-400"
              fontFamily="IBM Plex Sans Arabic"
            >
              {pos.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}

export default RadarChart
