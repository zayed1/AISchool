// #18 — How it works page
function HowItWorks({ onClose }) {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">كيف يعمل الكاشف؟</h2>
        <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="إغلاق">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Pipeline steps */}
      <div className="space-y-4">
        {[
          {
            num: 1,
            title: 'استقبال النص',
            description: 'يتم استقبال النص العربي والتحقق من صلاحيته (50-5000 كلمة، نسبة عربية كافية).',
            color: 'bg-blue-500',
            details: 'يُقسَّم النص إلى جمل باستخدام علامات الترقيم العربية والعالمية.',
          },
          {
            num: 2,
            title: 'التحليل الإحصائي',
            description: 'نحلل 6 مؤشرات إحصائية تميز النصوص الآلية عن البشرية:',
            color: 'bg-emerald-500',
            details: null,
            list: [
              'تنوع المفردات (TTR) — النصوص الآلية تكرر نفس الكلمات',
              'تباين أطوال الجمل — البشر يكتبون جملاً متفاوتة الطول',
              'تكرار العبارات الافتتاحية — الآلة تبدأ الجمل بنفس العبارات',
              'كثافة أدوات الربط — الآلة تفرط في "بالإضافة إلى ذلك" وشبيهاتها',
              'نسبة الأخطاء — البشر يخطئون طبيعياً، الآلة لا تخطئ',
              'الانفجارية — البشر يتفاوتون في كثافة الكتابة بين الفقرات',
            ],
          },
          {
            num: 3,
            title: 'نموذج التعلم العميق',
            description: 'نستخدم نموذج Transformer مدرب على نصوص عربية بشرية ومولدة. يحلل الأنماط اللغوية العميقة.',
            color: 'bg-purple-500',
            details: 'يقدم النموذج تصنيفاً (بشري/آلي) مع نسبة ثقة.',
          },
          {
            num: 4,
            title: 'تحليل الجمل',
            description: 'كل جملة تُحلل بشكل منفرد لتحديد الأجزاء المشبوهة مع تدرج لوني مستمر.',
            color: 'bg-amber-500',
            details: 'أخضر = طبيعي، أصفر = مشبوه قليلاً، أحمر = مشبوه جداً.',
          },
          {
            num: 5,
            title: 'دمج النتائج',
            description: 'تُدمج نتائج التحليل الإحصائي مع نموذج ML بأوزان متوازنة لإعطاء نسبة نهائية واحدة.',
            color: 'bg-red-500',
            details: 'النسبة النهائية هي تقدير احتمالي وليست حكماً قاطعاً.',
          },
        ].map((step) => (
          <div key={step.num} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-start gap-4">
              <div className={`w-8 h-8 ${step.color} rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                {step.num}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">{step.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{step.description}</p>
                {step.list && (
                  <ul className="mt-2 space-y-1">
                    {step.list.map((item, i) => (
                      <li key={i} className="text-xs text-slate-500 dark:text-slate-400 flex gap-2">
                        <span className="text-primary-500 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {step.details && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 italic">{step.details}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Important note */}
      <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
        <div className="flex gap-2">
          <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">ملاحظة مهمة</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 leading-relaxed">
              لا يوجد كاشف مثالي 100%. هذه الأداة تقدم تقديرات احتمالية. النصوص القصيرة أقل دقة.
              التحرير البشري للنصوص المولدة قد يصعّب الكشف. استخدم النتائج كأداة مساعدة لا كدليل قاطع.
            </p>
          </div>
        </div>
      </div>

      <button onClick={onClose} className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors">
        فهمت، ابدأ التحليل
      </button>
    </div>
  )
}

export default HowItWorks
