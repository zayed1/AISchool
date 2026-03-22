const steps = [
  { key: 'statistical', label: 'التحليل الإحصائي' },
  { key: 'ml', label: 'نموذج الذكاء الاصطناعي' },
  { key: 'combining', label: 'تجميع النتائج' },
]

function ProgressSteps({ currentStep }) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep)

  return (
    <div className="w-full max-w-md mx-auto py-4">
      <div className="flex items-center justify-between relative">
        {/* Line behind steps */}
        <div className="absolute top-5 right-6 left-6 h-0.5 bg-slate-200 z-0" />
        <div
          className="absolute top-5 right-6 h-0.5 bg-primary-500 z-0 transition-all duration-500"
          style={{ width: `${Math.max(0, currentIndex / (steps.length - 1)) * (100 - 10)}%` }}
        />

        {steps.map((step, index) => {
          const isDone = index < currentIndex
          const isActive = index === currentIndex

          return (
            <div key={step.key} className="flex flex-col items-center z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isDone
                    ? 'bg-primary-500 text-white'
                    : isActive
                    ? 'bg-primary-500 text-white animate-pulse'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                {isDone ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span className={`text-xs mt-2 font-medium text-center ${
                isDone || isActive ? 'text-primary-600' : 'text-slate-400'
              }`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProgressSteps
