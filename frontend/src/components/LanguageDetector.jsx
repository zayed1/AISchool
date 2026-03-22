// #8 — Auto language detection with visual warning
import { useMemo } from 'react'

function LanguageDetector({ text }) {
  const analysis = useMemo(() => {
    if (!text || text.trim().length < 20) return null

    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g
    const latinRegex = /[a-zA-Z]/g
    const cleanText = text.replace(/\s+/g, '')

    const arabicCount = (text.match(arabicRegex) || []).length
    const latinCount = (text.match(latinRegex) || []).length
    const totalAlpha = arabicCount + latinCount

    if (totalAlpha === 0) return null

    const arabicPct = Math.round((arabicCount / totalAlpha) * 100)
    const latinPct = Math.round((latinCount / totalAlpha) * 100)

    // Find non-Arabic segments
    const segments = []
    let lastIdx = 0
    const words = text.split(/\s+/)
    let nonArabicRun = []

    words.forEach((word, i) => {
      const hasLatin = /[a-zA-Z]{3,}/.test(word)
      if (hasLatin) {
        nonArabicRun.push(word)
      } else if (nonArabicRun.length > 0) {
        segments.push(nonArabicRun.join(' '))
        nonArabicRun = []
      }
    })
    if (nonArabicRun.length > 0) segments.push(nonArabicRun.join(' '))

    return {
      arabicPct,
      latinPct,
      isMainlyArabic: arabicPct >= 70,
      hasMixedContent: latinPct >= 10 && latinPct < 70,
      isNotArabic: arabicPct < 30,
      nonArabicSegments: segments.slice(0, 3),
    }
  }, [text])

  if (!analysis) return null

  if (analysis.isMainlyArabic && !analysis.hasMixedContent) return null

  if (analysis.isNotArabic) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm" role="alert">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="font-medium text-red-700 dark:text-red-400">النص ليس عربياً</p>
            <p className="text-red-600 dark:text-red-400 text-xs mt-0.5">
              نسبة النص العربي {analysis.arabicPct}% فقط. هذه الأداة مصممة للنصوص العربية.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (analysis.hasMixedContent) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm" role="alert">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="font-medium text-amber-700 dark:text-amber-400">النص يحتوي أجزاء غير عربية ({analysis.latinPct}%)</p>
            {analysis.nonArabicSegments.length > 0 && (
              <p className="text-amber-600 dark:text-amber-400 text-xs mt-1" dir="ltr">
                مثال: {analysis.nonArabicSegments.join(' | ')}
              </p>
            )}
            <p className="text-amber-600 dark:text-amber-400 text-xs mt-0.5">
              قد تتأثر دقة التحليل بوجود نصوص بلغات أخرى.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default LanguageDetector
