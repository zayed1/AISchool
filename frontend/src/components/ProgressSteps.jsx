// #43 — Enhanced progress steps with live stage names, descriptions, and elapsed time
import { useState, useEffect, useRef } from 'react'

const steps = [
  { key: 'statistical', label: 'التحليل الإحصائي', desc: 'فحص تنوع المفردات وبنية الجمل', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { key: 'ml', label: 'نموذج الذكاء الاصطناعي', desc: 'تصنيف النص بنموذج التعلم العميق', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { key: 'combining', label: 'تجميع النتائج', desc: 'دمج التحليل الإحصائي مع نتيجة النموذج', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
]

function ProgressSteps({ currentStep }) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())

  // Elapsed timer
  useEffect(() => {
    startRef.current = Date.now()
    const timer = setInterval(() => {
      setElapsed(((Date.now() - startRef.current) / 1000).toFixed(1))
    }, 100)
    return () => clearInterval(timer)
  }, [])

  const progress = Math.max(0, (currentIndex + 0.5) / steps.length) * 100

  return (
    <div className="w-full max-w-md mx-auto py-4" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="تقدم التحليل">
      {/* #43 — Overall progress bar */}
      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between relative">
        {/* Line behind steps */}
        <div className="absolute top-5 right-6 left-6 h-0.5 bg-slate-200 dark:bg-slate-700 z-0" />
        <div
          className="absolute top-5 right-6 h-0.5 bg-primary-500 z-0 transition-all duration-500"
          style={{ width: `${Math.max(0, currentIndex / (steps.length - 1)) * (100 - 10)}%` }}
        />

        {steps.map((step, index) => {
          const isDone = index < currentIndex
          const isActive = index === currentIndex

          return (
            <div key={step.key} className="flex flex-col items-center z-10 flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isDone
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-200 dark:shadow-primary-900/30'
                    : isActive
                    ? 'bg-primary-500 text-white animate-pulse shadow-lg shadow-primary-300 dark:shadow-primary-800/40'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }`}
              >
                {isDone ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                  </svg>
                )}
              </div>
              <span className={`text-xs mt-2 font-medium text-center leading-tight ${
                isDone ? 'text-primary-600 dark:text-primary-400' : isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'
              }`}>
                {step.label}
              </span>
              {/* #43 — Active step description */}
              {isActive && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 text-center animate-fade-in">
                  {step.desc}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* #43 — Elapsed time */}
      <div className="text-center mt-4">
        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono tabular-nums" aria-live="polite">
          {elapsed} ثانية
        </span>
      </div>
    </div>
  )
}

export default ProgressSteps
