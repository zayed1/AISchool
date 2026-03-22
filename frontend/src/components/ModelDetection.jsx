// Model detection component — estimates which AI model generated text
import { useMemo } from 'react'

// AI model signature patterns (heuristic-based)
const MODEL_SIGNATURES = {
  gpt: {
    label: 'GPT (OpenAI)',
    markers: ['بالإضافة إلى ذلك', 'في هذا السياق', 'من الجدير بالذكر', 'يمكن القول إن', 'في الختام', 'على سبيل المثال', 'بشكل عام', 'من المهم أن'],
    style: { avgSentLen: [15, 25], connectorHeavy: true, formalHigh: true },
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/10',
  },
  claude: {
    label: 'Claude (Anthropic)',
    markers: ['أود أن أوضح', 'من المنظور', 'يتعين علينا', 'ثمة', 'لا سيما', 'يستدعي', 'على نحو', 'بيد أن'],
    style: { avgSentLen: [18, 30], connectorHeavy: false, formalHigh: true },
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/10',
  },
  gemini: {
    label: 'Gemini (Google)',
    markers: ['وفقاً لـ', 'تشير الدراسات', 'من حيث', 'فيما يتعلق', 'في ضوء', 'تُظهر', 'يُلاحظ', 'وتتضمن'],
    style: { avgSentLen: [12, 22], connectorHeavy: false, formalHigh: false },
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/10',
  },
}

function ModelDetection({ text, statistical, ml }) {
  const detection = useMemo(() => {
    if (!text || ml?.label?.toUpperCase() !== 'AI') return null

    const textClean = text.toLowerCase()
    const sentences = text.split(/[.؟!\u061F]+/).filter((s) => s.trim())
    const avgSentLen = sentences.length > 0 ? text.split(/\s+/).length / sentences.length : 0

    const scores = {}

    Object.entries(MODEL_SIGNATURES).forEach(([key, sig]) => {
      let score = 0
      // Marker matching
      const markerHits = sig.markers.filter((m) => textClean.includes(m)).length
      score += (markerHits / sig.markers.length) * 50

      // Sentence length matching
      const [minLen, maxLen] = sig.style.avgSentLen
      if (avgSentLen >= minLen && avgSentLen <= maxLen) score += 20
      else score += Math.max(0, 20 - Math.abs(avgSentLen - (minLen + maxLen) / 2) * 2)

      // Connector density matching
      const connectorDensity = statistical?.connector_density || 0
      if (sig.style.connectorHeavy && connectorDensity > 1.5) score += 15
      else if (!sig.style.connectorHeavy && connectorDensity <= 1.5) score += 15

      // Formality matching
      const ttr = statistical?.ttr || 0.5
      if (sig.style.formalHigh && ttr < 0.5) score += 15
      else if (!sig.style.formalHigh && ttr >= 0.4) score += 15

      scores[key] = Math.min(100, Math.round(score))
    })

    // Normalize to sum = 100
    const total = Object.values(scores).reduce((s, v) => s + v, 0)
    const normalized = {}
    Object.entries(scores).forEach(([k, v]) => {
      normalized[k] = total > 0 ? Math.round((v / total) * 100) : 33
    })

    // Sort by confidence
    const sorted = Object.entries(normalized)
      .sort(([, a], [, b]) => b - a)
      .map(([key, confidence]) => ({
        key,
        ...MODEL_SIGNATURES[key],
        confidence,
      }))

    return {
      primary: sorted[0],
      all: sorted,
    }
  }, [text, statistical, ml])

  if (!detection) return null

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        تقدير النموذج المُستخدم
      </h3>

      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">تقدير تجريبي بناءً على أنماط لغوية — ليس دقيقاً 100%</p>

      {/* Primary detection */}
      <div className={`rounded-lg p-4 mb-4 ${detection.primary.bgColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${detection.primary.color}`} />
            <span className="font-bold text-slate-800 dark:text-slate-200">{detection.primary.label}</span>
          </div>
          <span className="text-2xl font-bold text-slate-700 dark:text-slate-200">{detection.primary.confidence}%</span>
        </div>
      </div>

      {/* All models */}
      <div className="space-y-2">
        {detection.all.map((model) => (
          <div key={model.key} className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${model.color} shrink-0`} />
            <span className="text-sm text-slate-600 dark:text-slate-400 flex-1">{model.label}</span>
            <div className="w-24 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${model.color} transition-all duration-700`} style={{ width: `${model.confidence}%` }} />
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-8 text-left">{model.confidence}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ModelDetection
