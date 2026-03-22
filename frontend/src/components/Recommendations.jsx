// #10 — Personalized recommendations after analysis
function Recommendations({ result, statistical, metadata }) {
  const tips = []

  // Based on result
  if (result.percentage >= 65) {
    tips.push({ icon: '🔍', text: 'جرّب تحليل كل فقرة على حدة لتحديد الأجزاء المشبوهة بدقة أكبر' })
    tips.push({ icon: '📝', text: 'قارن هذا النص مع نص آخر معروف لنفس الكاتب' })
    if (metadata.word_count < 150) {
      tips.push({ icon: '📏', text: 'النص قصير — النتائج تكون أدق مع نصوص أطول (200+ كلمة)' })
    }
  } else if (result.percentage >= 40) {
    tips.push({ icon: '⚖️', text: 'النتيجة في المنطقة الرمادية — استخدم أداة المقارنة مع نص آخر للتأكد' })
    tips.push({ icon: '🔄', text: 'أعد التحليل بعد إزالة الاقتباسات والمراجع إن وجدت' })
  } else {
    tips.push({ icon: '✅', text: 'النص يبدو بشرياً — لكن تذكر أن النتائج تقديرية' })
  }

  // Based on indicators
  if (statistical.repetitive_openers_ratio > 0.15) {
    tips.push({ icon: '🔁', text: 'لاحظنا تكراراً في بدايات الجمل — هذا نمط شائع في النصوص المولدة' })
  }
  if (statistical.error_ratio < 0.002 && result.percentage > 30) {
    tips.push({ icon: '✏️', text: 'النص خالٍ تقريباً من الأخطاء — البشر عادة يرتكبون أخطاء طبيعية' })
  }

  // Limit to 4
  const finalTips = tips.slice(0, 4)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        توصيات
      </h3>
      <div className="space-y-2">
        {finalTips.map((tip, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span className="text-base shrink-0">{tip.icon}</span>
            <span>{tip.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Recommendations
