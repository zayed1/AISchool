// Executive summary — auto-generated paragraph explaining the result
function ExecutiveSummary({ result, statistical, ml, metadata }) {
  const pct = result.percentage
  const isAI = pct >= 50
  const mlIsAI = ml.label.toUpperCase() === 'AI'
  const mlConf = Math.round(ml.confidence * 100)

  // Build explanatory sentences
  const parts = []

  // Opening
  if (pct >= 85) parts.push(`يشير التحليل بقوة إلى أن هذا النص مولّد بالذكاء الاصطناعي بنسبة ${pct}%.`)
  else if (pct >= 65) parts.push(`توجد مؤشرات قوية على أن هذا النص يحتوي أجزاء مولّدة آلياً (${pct}%).`)
  else if (pct >= 45) parts.push(`النتيجة غير حاسمة (${pct}%) — النص يقع في المنطقة الرمادية بين الكتابة البشرية والآلية.`)
  else if (pct >= 25) parts.push(`النص يبدو بشرياً بدرجة جيدة (${pct}% فقط احتمال AI).`)
  else parts.push(`النص يظهر خصائص بشرية واضحة جداً — احتمال كونه مولّداً آلياً ${pct}% فقط.`)

  // ML agreement/disagreement
  if (mlIsAI === isAI) {
    parts.push(`نموذج التعلم العميق يؤكد ذلك بثقة ${mlConf}%.`)
  } else {
    parts.push(`لكن نموذج التعلم العميق يعطي نتيجة مختلفة (${mlIsAI ? 'AI' : 'بشري'} بثقة ${mlConf}%)، مما يستدعي مراجعة يدوية.`)
  }

  // Key statistical findings
  const findings = []
  if (statistical.repetitive_openers_ratio > 0.15) findings.push('تكرار ملحوظ في العبارات الافتتاحية')
  if (statistical.connector_density > 2) findings.push('إفراط في أدوات الربط')
  if (statistical.error_ratio < 0.002 && pct > 40) findings.push('خلو شبه تام من الأخطاء')
  if (statistical.burstiness < 0.2 && pct > 40) findings.push('تجانس غير طبيعي في كثافة النص')
  if (statistical.ttr > 0.5 && pct < 40) findings.push('تنوع جيد في المفردات')
  if (statistical.sentence_length_cv > 0.4 && pct < 40) findings.push('تباين طبيعي في أطوال الجمل')

  if (findings.length > 0) {
    parts.push(`أبرز الملاحظات: ${findings.join('، ')}.`)
  }

  // Metadata
  parts.push(`تم تحليل ${metadata.word_count} كلمة في ${metadata.sentence_count} جملة خلال ${metadata.analysis_time_ms} مللي ثانية.`)

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        الملخص التنفيذي
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{parts.join(' ')}</p>
    </div>
  )
}

export default ExecutiveSummary
