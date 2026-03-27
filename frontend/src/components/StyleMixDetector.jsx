// #88 — Smart style detector: identifies formal vs colloquial (عامية) paragraphs
import { useMemo, useState } from 'react'

// Common colloquial markers
const COLLOQUIAL_MARKERS = [
  'عشان', 'علشان', 'ليه', 'ايش', 'وش', 'كذا', 'بس', 'هيك',
  'يعني', 'طيب', 'أوكي', 'خلاص', 'يلا', 'هلا', 'ياخي',
  'ما أدري', 'لأنو', 'لانه', 'كيذا', 'هالشي', 'حتى لو',
  'مو', 'مب', 'ماله', 'شلون', 'كيفك', 'ان شاء الله', 'ما شاء الله',
  'أكيد', 'يا ريت', 'مرة', 'أبد', 'وايد', 'زين', 'حلو',
  'تمام', 'حبيبي', 'والله', 'بصراحة', 'الصراحة', 'ما يصير',
]

// Formal AI-like markers
const FORMAL_MARKERS = [
  'بالإضافة إلى', 'علاوة على ذلك', 'من الجدير بالذكر', 'في هذا السياق',
  'يُعدّ', 'يُعتبر', 'تتمثل', 'يتضح', 'نستنتج', 'يتبين',
  'من المنظور', 'وفقاً لـ', 'استناداً إلى', 'بناءً على',
  'في إطار', 'على صعيد', 'في ضوء', 'حيث يُشير',
  'تجدر الإشارة', 'لا بد من الإشارة', 'ثمة', 'إذ أن',
]

function StyleMixDetector({ sentences }) {
  const [expanded, setExpanded] = useState(false)

  const analysis = useMemo(() => {
    if (!sentences || sentences.length < 3) return null

    const classified = sentences.map((s, i) => {
      const text = s.text.toLowerCase()
      const words = text.split(/\s+/)
      let colloquialScore = 0
      let formalScore = 0

      for (const marker of COLLOQUIAL_MARKERS) {
        if (text.includes(marker)) colloquialScore++
      }
      for (const marker of FORMAL_MARKERS) {
        if (text.includes(marker)) formalScore++
      }

      // Normalize by word count
      const norm = Math.max(words.length, 1)
      const colloquialRatio = colloquialScore / norm
      const formalRatio = formalScore / norm

      let style = 'neutral'
      if (colloquialRatio > 0.05 || colloquialScore >= 2) style = 'colloquial'
      else if (formalRatio > 0.03 || formalScore >= 2) style = 'formal'

      return { index: i, text: s.text, style, colloquialScore, formalScore }
    })

    const formalCount = classified.filter(c => c.style === 'formal').length
    const colloquialCount = classified.filter(c => c.style === 'colloquial').length
    const isMixed = formalCount > 0 && colloquialCount > 0

    if (!isMixed && formalCount === 0 && colloquialCount === 0) return null

    return { classified, formalCount, colloquialCount, isMixed }
  }, [sentences])

  if (!analysis) return null

  const styleColors = {
    formal: { bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-r-blue-400', text: 'text-blue-700 dark:text-blue-400', badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
    colloquial: { bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-r-amber-400', text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
    neutral: { bg: '', border: 'border-r-slate-200 dark:border-r-slate-700', text: 'text-slate-500', badge: '' },
  }

  const styleSentences = analysis.classified.filter(c => c.style !== 'neutral')
  const shown = expanded ? styleSentences : styleSentences.slice(0, 4)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-2">
        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
        كشف الأسلوب المختلط
      </h3>
      <p className="text-xs text-slate-400 mb-3">تحليل التبديل بين الفصحى والعامية</p>

      {/* Summary */}
      <div className="flex gap-3 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          <span className="text-xs text-slate-600 dark:text-slate-400">{analysis.formalCount} فصحى</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="text-xs text-slate-600 dark:text-slate-400">{analysis.colloquialCount} عامية</span>
        </div>
        {analysis.isMixed && (
          <span className="text-[10px] px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full font-medium">أسلوب مختلط</span>
        )}
      </div>

      {/* Sentences */}
      <div className="space-y-2">
        {shown.map((s) => {
          const colors = styleColors[s.style]
          return (
            <div key={s.index} className={`${colors.bg} border-r-2 ${colors.border} rounded-lg p-2.5 text-xs leading-relaxed`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${colors.badge}`}>
                  {s.style === 'formal' ? 'فصحى رسمية' : 'عامية'}
                </span>
                <span className="text-[10px] text-slate-400">جملة {s.index + 1}</span>
              </div>
              <p className={`${colors.text} max-h-12 overflow-hidden`}>{s.text}</p>
            </div>
          )
        })}
      </div>

      {styleSentences.length > 4 && (
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary-500 hover:text-primary-600 mt-2 font-medium">
          {expanded ? 'تقليص' : `عرض الكل (${styleSentences.length})`}
        </button>
      )}
    </div>
  )
}

export default StyleMixDetector
