// #7 — Detailed "Why this result?" explanation
function WhyThisResult({ statistical, ml, result }) {
  // Calculate which indicators contributed most
  const indicators = [
    { key: 'ttr', label: 'تنوع المفردات', value: statistical.ttr, max: 1, weight: 0.15, explanation: 'تنوع المفردات منخفض مما يشير لنمط تكراري آلي', goodExplanation: 'تنوع المفردات طبيعي يشبه الكتابة البشرية' },
    { key: 'sentence_length_cv', label: 'تباين أطوال الجمل', value: statistical.sentence_length_cv, max: 1, weight: 0.15, explanation: 'أطوال الجمل متقاربة جداً وهو نمط آلي', goodExplanation: 'تباين طبيعي في أطوال الجمل' },
    { key: 'repetitive_openers_ratio', label: 'تكرار الافتتاحيات', value: statistical.repetitive_openers_ratio, max: 0.5, weight: 0.2, explanation: 'تكرار ملحوظ في العبارات الافتتاحية', goodExplanation: 'تنوع جيد في بدايات الجمل' },
    { key: 'connector_density', label: 'كثافة أدوات الربط', value: statistical.connector_density, max: 4, weight: 0.15, explanation: 'إفراط في استخدام أدوات الربط', goodExplanation: 'استخدام طبيعي لأدوات الربط' },
    { key: 'error_ratio', label: 'نسبة الأخطاء', value: statistical.error_ratio, max: 0.05, weight: 0.15, explanation: 'النص شبه خالٍ من الأخطاء بشكل غير طبيعي', goodExplanation: 'وجود أخطاء طبيعية يشبه الكتابة البشرية' },
    { key: 'burstiness', label: 'الانفجارية', value: statistical.burstiness, max: 1, weight: 0.2, explanation: 'كثافة النص متساوية بشكل آلي', goodExplanation: 'تفاوت طبيعي في كثافة الفقرات' },
  ]

  // Normalize and sort by contribution
  const analyzed = indicators
    .map((ind) => {
      const normalized = Math.min(ind.value / ind.max, 1)
      const contribution = normalized * ind.weight
      const isSuspicious = normalized >= 0.5
      return { ...ind, normalized, contribution, isSuspicious }
    })
    .sort((a, b) => b.contribution - a.contribution)

  const topFactors = analyzed.slice(0, 3)
  const isAI = result.percentage >= 50

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        لماذا هذه النتيجة؟
      </h3>

      {/* Summary */}
      <div className={`rounded-lg p-3 mb-4 ${isAI ? 'bg-red-50 dark:bg-red-900/10' : 'bg-green-50 dark:bg-green-900/10'}`}>
        <p className={`text-sm ${isAI ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
          {isAI
            ? `النص يظهر خصائص نموذجية للنصوص المولدة آلياً بنسبة ${result.percentage}%. النموذج ${ml.label.toUpperCase() === 'AI' ? 'يؤكد' : 'لا يؤكد'} ذلك بثقة ${Math.round(ml.confidence * 100)}%.`
            : `النص يظهر خصائص بشرية طبيعية. احتمال كونه مولداً آلياً ${result.percentage}% فقط.`
          }
        </p>
      </div>

      {/* Top contributing factors */}
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">العوامل الأكثر تأثيراً:</p>
      <div className="space-y-3">
        {topFactors.map((factor, idx) => (
          <div key={factor.key} className="flex items-start gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
              factor.isSuspicious
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
            }`}>
              {idx + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{factor.label}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">{Math.round(factor.normalized * 100)}%</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {factor.isSuspicious ? factor.explanation : factor.goodExplanation}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ML vs Statistical comparison */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        <div className="flex gap-4 text-center">
          <div className="flex-1 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
            <p className="text-xs text-slate-400 dark:text-slate-500">التحليل الإحصائي</p>
            <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{Math.round(statistical.statistical_score * 100)}%</p>
          </div>
          <div className="flex-1 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
            <p className="text-xs text-slate-400 dark:text-slate-500">نموذج ML</p>
            <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{Math.round(ml.ml_score * 100)}%</p>
          </div>
          <div className="flex-1 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
            <p className="text-xs text-primary-500 dark:text-primary-400">النتيجة النهائية</p>
            <p className="text-lg font-bold text-primary-700 dark:text-primary-300">{result.percentage}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WhyThisResult
