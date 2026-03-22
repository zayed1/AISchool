// #17 — Interactive onboarding tour
import { useState, useEffect } from 'react'

const steps = [
  {
    title: 'مرحباً بك!',
    description: 'هذه أداة لكشف النصوص العربية المولدة بالذكاء الاصطناعي. تستخدم التحليل الإحصائي ونماذج التعلم العميق.',
    icon: '👋',
  },
  {
    title: 'الصق النص',
    description: 'الصق النص العربي المراد فحصه (50-5000 كلمة). يمكنك أيضاً سحب ملف أو لصق رابط مقال.',
    icon: '📝',
  },
  {
    title: 'التحليل',
    description: 'اضغط "تحقق الآن" أو Ctrl+Enter. سيتم تحليل النص إحصائياً ثم بنموذج ذكاء اصطناعي متخصص.',
    icon: '🔍',
  },
  {
    title: 'النتائج',
    description: 'ستحصل على نسبة مئوية، مؤشرات إحصائية، تحليل جملة بجملة، ورسم بياني عنكبوتي. يمكنك تصدير التقرير أو مشاركته.',
    icon: '📊',
  },
]

function OnboardingTour({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    try {
      const seen = localStorage.getItem('onboarding_completed')
      if (!seen) {
        setIsVisible(true)
      }
    } catch {}
  }, [])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true')
    setIsVisible(false)
    onComplete?.()
  }

  if (!isVisible) return null

  const step = steps[currentStep]

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-5 animate-scale-in">
          {/* Step indicator */}
          <div className="flex gap-1.5 justify-center">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-8 bg-primary-500' : i < currentStep ? 'w-4 bg-primary-300' : 'w-4 bg-slate-200 dark:bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="text-center text-4xl">{step.icon}</div>

          {/* Content */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{step.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.description}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleComplete}
              className="flex-1 py-2.5 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              تخطي
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {currentStep < steps.length - 1 ? 'التالي' : 'ابدأ الآن'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default OnboardingTour
