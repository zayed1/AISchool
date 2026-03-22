// Style analysis component — readability, formality, complexity
import { useMemo } from 'react'

function StyleAnalysis({ text, statistical }) {
  const analysis = useMemo(() => {
    if (!text || text.trim().length < 50) return null

    const words = text.trim().split(/\s+/)
    const sentences = text.split(/[.؟!\u061F\u0964\u06D4]+/).filter((s) => s.trim())
    const avgSentLen = sentences.length > 0 ? words.length / sentences.length : 0
    const avgWordLen = words.length > 0 ? words.join('').length / words.length : 0

    // Arabic Readability (simplified Flesch-like)
    // Higher = easier to read
    const readabilityScore = Math.max(0, Math.min(100,
      206.835 - (1.015 * avgSentLen) - (84.6 * (avgWordLen / 10))
    ))

    let readabilityLevel, readabilityColor
    if (readabilityScore >= 70) { readabilityLevel = 'سهل'; readabilityColor = 'text-green-600 dark:text-green-400' }
    else if (readabilityScore >= 50) { readabilityLevel = 'متوسط'; readabilityColor = 'text-yellow-600 dark:text-yellow-400' }
    else if (readabilityScore >= 30) { readabilityLevel = 'صعب'; readabilityColor = 'text-orange-600 dark:text-orange-400' }
    else { readabilityLevel = 'صعب جداً'; readabilityColor = 'text-red-600 dark:text-red-400' }

    // Formality detection
    const formalMarkers = ['إذ', 'حيث', 'نظراً', 'يُعدّ', 'يُعد', 'بالتالي', 'علاوة', 'فضلاً', 'إضافةً', 'تجدر', 'ينبغي', 'يتعين', 'لا سيما', 'ثمة']
    const informalMarkers = ['يعني', 'كذا', 'ههه', 'اللي', 'عشان', 'كيذا', 'وش', 'ايش', 'بس', 'يلا', 'كده', 'أوي', 'دي', 'دا', 'زي']

    const textLower = text.toLowerCase()
    const formalCount = formalMarkers.filter((m) => textLower.includes(m)).length
    const informalCount = informalMarkers.filter((m) => textLower.includes(m)).length
    const formalityScore = formalCount - informalCount

    let formalityLevel, formalityColor
    if (formalityScore >= 3) { formalityLevel = 'رسمي جداً'; formalityColor = 'text-blue-600 dark:text-blue-400' }
    else if (formalityScore >= 1) { formalityLevel = 'رسمي'; formalityColor = 'text-blue-500 dark:text-blue-400' }
    else if (formalityScore >= -1) { formalityLevel = 'متوسط'; formalityColor = 'text-slate-600 dark:text-slate-400' }
    else { formalityLevel = 'غير رسمي'; formalityColor = 'text-amber-600 dark:text-amber-400' }

    // Complexity — based on word diversity + sentence length + connector usage
    const uniqueWords = new Set(words.map((w) => w.replace(/[^\u0600-\u06FF]/g, ''))).size
    const lexicalDensity = words.length > 0 ? uniqueWords / words.length : 0
    const complexityScore = Math.round(
      (lexicalDensity * 40) + (Math.min(avgSentLen / 30, 1) * 30) + (Math.min((statistical?.connector_density || 0) / 3, 1) * 30)
    )

    let complexityLevel, complexityColor
    if (complexityScore >= 70) { complexityLevel = 'معقد'; complexityColor = 'text-purple-600 dark:text-purple-400' }
    else if (complexityScore >= 45) { complexityLevel = 'متوسط'; complexityColor = 'text-slate-600 dark:text-slate-400' }
    else { complexityLevel = 'بسيط'; complexityColor = 'text-emerald-600 dark:text-emerald-400' }

    // Vocabulary richness (Hapax Legomena ratio)
    const wordFreq = {}
    words.forEach((w) => { const clean = w.replace(/[^\u0600-\u06FF]/g, ''); if (clean) wordFreq[clean] = (wordFreq[clean] || 0) + 1 })
    const hapax = Object.values(wordFreq).filter((c) => c === 1).length
    const hapaxRatio = Object.keys(wordFreq).length > 0 ? Math.round((hapax / Object.keys(wordFreq).length) * 100) : 0

    return {
      readabilityScore: Math.round(readabilityScore), readabilityLevel, readabilityColor,
      formalityLevel, formalityColor, formalityScore,
      complexityScore, complexityLevel, complexityColor,
      avgSentLen: avgSentLen.toFixed(1),
      avgWordLen: avgWordLen.toFixed(1),
      hapaxRatio,
      uniqueWords,
      totalWords: words.length,
    }
  }, [text, statistical])

  if (!analysis) return null

  const metrics = [
    { label: 'القراءة', value: analysis.readabilityLevel, sub: `${analysis.readabilityScore}/100`, color: analysis.readabilityColor, pct: analysis.readabilityScore },
    { label: 'الرسمية', value: analysis.formalityLevel, sub: `${analysis.formalityScore > 0 ? '+' : ''}${analysis.formalityScore}`, color: analysis.formalityColor, pct: Math.min(100, Math.max(0, (analysis.formalityScore + 5) * 10)) },
    { label: 'التعقيد', value: analysis.complexityLevel, sub: `${analysis.complexityScore}/100`, color: analysis.complexityColor, pct: analysis.complexityScore },
  ]

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        تحليل الأسلوب
      </h3>

      {/* Main metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {metrics.map((m) => (
          <div key={m.label} className="text-center">
            <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">{m.label}</p>
            <div className="w-full h-1 bg-slate-200 dark:bg-slate-600 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-primary-400 rounded-full transition-all duration-700" style={{ width: `${m.pct}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Detail stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        {[
          { label: 'متوسط الجملة', value: `${analysis.avgSentLen} كلمة` },
          { label: 'متوسط الكلمة', value: `${analysis.avgWordLen} حرف` },
          { label: 'كلمات فريدة', value: `${analysis.uniqueWords}/${analysis.totalWords}` },
          { label: 'نسبة الفريد', value: `${analysis.hapaxRatio}%` },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{s.value}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StyleAnalysis
