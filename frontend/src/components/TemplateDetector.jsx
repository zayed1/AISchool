// #3 — Detect template/cliché phrases common in AI text and highlight them
import { useMemo, useState } from 'react'

const TEMPLATE_PHRASES = [
  'في عالمنا المعاصر',
  'في عصرنا الحالي',
  'في ظل التطورات',
  'يُعدّ من أهم',
  'يُعد من أهم',
  'تُعدّ من أهم',
  'تُعد من أهم',
  'لا يمكن إنكار',
  'لا يمكن تجاهل',
  'من المعروف أن',
  'مما لا شك فيه',
  'في الختام',
  'خلاصة القول',
  'في نهاية المطاف',
  'يلعب دوراً هاماً',
  'يلعب دوراً كبيراً',
  'يلعب دورا هاما',
  'يلعب دورا كبيرا',
  'تلعب دوراً',
  'على حد سواء',
  'بشكل كبير',
  'بشكل ملحوظ',
  'بصورة متزايدة',
  'في هذا السياق',
  'تجدر الإشارة إلى',
  'من الجدير بالذكر',
  'يمكن القول إن',
  'من هذا المنطلق',
  'في واقع الأمر',
  'على صعيد آخر',
  'في ضوء ما سبق',
  'وبناءً على ذلك',
  'يتضح مما سبق',
  'نستنتج مما سبق',
  'بالإضافة إلى ما سبق',
  'إن التطور التكنولوجي',
  'إن التقدم التكنولوجي',
  'في ظل العولمة',
  'في ظل التحديات',
  'يسهم في تعزيز',
  'يساهم في تطوير',
  'ركيزة أساسية',
  'حجر الزاوية',
  'عاملاً حاسماً',
  'عاملا حاسما',
]

function TemplateDetector({ sentences }) {
  const [showAll, setShowAll] = useState(false)

  const analysis = useMemo(() => {
    if (!sentences || sentences.length === 0) return null

    const fullText = sentences.map((s) => s.text).join(' ')
    const found = []

    for (const phrase of TEMPLATE_PHRASES) {
      const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      let match
      while ((match = regex.exec(fullText)) !== null) {
        // Find surrounding context (30 chars before/after)
        const start = Math.max(0, match.index - 30)
        const end = Math.min(fullText.length, match.index + phrase.length + 30)
        const before = fullText.slice(start, match.index)
        const after = fullText.slice(match.index + phrase.length, end)
        found.push({ phrase, before, after })
      }
    }

    // Unique phrases count
    const uniquePhrases = [...new Set(found.map((f) => f.phrase))]
    const density = sentences.length > 0 ? found.length / sentences.length : 0

    return { found, uniquePhrases, density, total: found.length }
  }, [sentences])

  if (!analysis || analysis.total === 0) return null

  const severityColor = analysis.density >= 0.3
    ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
    : analysis.density >= 0.15
    ? 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10'
    : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10'

  const shown = showAll ? analysis.found : analysis.found.slice(0, 5)

  return (
    <div className={`rounded-xl border p-4 sm:p-6 ${severityColor}`}>
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        قوالب جاهزة مكتشفة
        <span className="text-xs font-normal text-slate-400">({analysis.total} عبارة — {analysis.uniquePhrases.length} نمط فريد)</span>
      </h3>

      <div className="space-y-2 mt-3">
        {shown.map((item, i) => (
          <div key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2" dir="rtl">
            <span className="text-amber-400 mt-0.5 shrink-0">●</span>
            <p>
              <span className="text-slate-400">...{item.before}</span>
              <mark className="bg-amber-200 dark:bg-amber-800/50 text-amber-900 dark:text-amber-200 px-0.5 rounded font-medium">{item.phrase}</mark>
              <span className="text-slate-400">{item.after}...</span>
            </p>
          </div>
        ))}
      </div>

      {analysis.found.length > 5 && (
        <button onClick={() => setShowAll(!showAll)} className="mt-2 text-xs text-primary-500 hover:text-primary-600">
          {showAll ? 'عرض أقل' : `عرض الكل (${analysis.total})`}
        </button>
      )}

      <p className="text-[10px] text-slate-400 mt-3">
        كثافة القوالب: {Math.round(analysis.density * 100)}% — {analysis.density >= 0.3 ? 'مرتفعة (سمة AI قوية)' : analysis.density >= 0.15 ? 'متوسطة' : 'منخفضة'}
      </p>
    </div>
  )
}

export default TemplateDetector
