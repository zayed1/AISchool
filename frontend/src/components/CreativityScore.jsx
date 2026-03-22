// #4 — Creativity score: measures originality vs AI-typical patterns
import { useMemo } from 'react'

function CreativityScore({ statistical, sentences }) {
  const score = useMemo(() => {
    if (!statistical || !sentences || sentences.length < 3) return null

    let creativity = 50 // baseline

    // High TTR = more creative vocabulary
    if (statistical.ttr >= 0.6) creativity += 15
    else if (statistical.ttr >= 0.5) creativity += 8
    else if (statistical.ttr <= 0.35) creativity -= 10

    // High sentence CV = varied sentence structure = creative
    if (statistical.sentence_length_cv >= 0.5) creativity += 12
    else if (statistical.sentence_length_cv >= 0.35) creativity += 5
    else if (statistical.sentence_length_cv <= 0.2) creativity -= 10

    // Low opener repetition = creative
    if (statistical.repetitive_openers_ratio <= 0.05) creativity += 10
    else if (statistical.repetitive_openers_ratio >= 0.2) creativity -= 15

    // Low connector density = natural flow
    if (statistical.connector_density <= 0.8) creativity += 5
    else if (statistical.connector_density >= 2.5) creativity -= 10

    // Errors = human touch
    if (statistical.error_ratio >= 0.01) creativity += 8
    else if (statistical.error_ratio <= 0.002) creativity -= 8

    // High burstiness = natural rhythm
    if (statistical.burstiness >= 0.4) creativity += 10
    else if (statistical.burstiness <= 0.15) creativity -= 10

    // Opener diversity (new indicator)
    if (statistical.opener_diversity >= 0.7) creativity += 8
    else if (statistical.opener_diversity <= 0.3) creativity -= 8

    // Check for varied sentence lengths (not monotone)
    const lengths = sentences.map((s) => s.text.split(/\s+/).length)
    const hasShort = lengths.some((l) => l <= 5)
    const hasLong = lengths.some((l) => l >= 20)
    if (hasShort && hasLong) creativity += 5

    return Math.max(0, Math.min(100, Math.round(creativity)))
  }, [statistical, sentences])

  if (score === null) return null

  const getLevel = () => {
    if (score >= 75) return { label: 'إبداعي ومتنوع', color: 'text-green-600 dark:text-green-400', ring: 'stroke-green-500' }
    if (score >= 55) return { label: 'أسلوب طبيعي', color: 'text-blue-600 dark:text-blue-400', ring: 'stroke-blue-500' }
    if (score >= 35) return { label: 'نمطي ومتوقع', color: 'text-amber-600 dark:text-amber-400', ring: 'stroke-amber-500' }
    return { label: 'قالبي وآلي', color: 'text-red-600 dark:text-red-400', ring: 'stroke-red-500' }
  }

  const level = getLevel()
  const circumference = 2 * Math.PI * 28
  const offset = circumference * (1 - score / 100)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        مؤشر الإبداع
      </h3>

      <div className="flex items-center gap-6">
        {/* Ring chart */}
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="4" className="dark:stroke-slate-700" />
            <circle cx="32" cy="32" r="28" fill="none" className={level.ring} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${level.color}`}>
            {score}
          </span>
        </div>

        <div className="flex-1">
          <p className={`text-base font-bold ${level.color} mb-1`}>{level.label}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
            {score >= 60
              ? 'النص يظهر تنوعاً في المفردات والبنية — سمات كتابة إنسانية أصيلة'
              : score >= 40
              ? 'النص متوسط التنوع — قد يكون بشرياً بأسلوب رسمي أو محرراً بواسطة AI'
              : 'النص يتبع أنماطاً متكررة ومتوقعة — سمة شائعة في النصوص المولدة'
            }
          </p>
        </div>
      </div>
    </div>
  )
}

export default CreativityScore
