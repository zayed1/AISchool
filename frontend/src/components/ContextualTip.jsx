// #10 — Contextual first-use tooltips
import { useState, useEffect } from 'react'

const TIPS = {
  history: { text: 'تحليلاتك السابقة ستظهر هنا — يمكنك البحث والفلترة والتصدير', position: 'top' },
  compare: { text: 'قارن بين نصين أو ثلاثة لمعرفة الفروقات في درجة الـ AI', position: 'bottom' },
  batch: { text: 'حلّل عدة نصوص أو ملفات دفعة واحدة وصدّر النتائج كـ CSV', position: 'bottom' },
  diff: { text: 'الصق نسختين لمعرفة أين تمت التعديلات بالضبط', position: 'bottom' },
  teacher: { text: 'أدخل أسماء الطلاب ونصوصهم واحصل على تقرير شامل', position: 'bottom' },
  settings: { text: 'تحكم بالمظهر، الحساسية، الخصوصية، واختصارات لوحة المفاتيح', position: 'bottom' },
  sample: { text: 'جرّب نصوصاً جاهزة لمعرفة كيف تعمل الأداة', position: 'top' },
}

export function useFirstUseTip(id) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const key = `tip_seen_${id}`
    if (!localStorage.getItem(key)) {
      const timer = setTimeout(() => setShow(true), 800)
      return () => clearTimeout(timer)
    }
  }, [id])

  const dismiss = () => {
    setShow(false)
    localStorage.setItem(`tip_seen_${id}`, 'true')
  }

  const tip = TIPS[id]
  return { show, dismiss, tip }
}

function ContextualTip({ id, children }) {
  const { show, dismiss, tip } = useFirstUseTip(id)

  if (!show || !tip) return <>{children}</>

  return (
    <div className="relative">
      {children}
      <div className={`absolute z-30 ${tip.position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} right-0 left-0 mx-auto max-w-xs`}>
        <div className="bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-lg p-3 shadow-xl leading-relaxed relative">
          <div className="flex items-start justify-between gap-2">
            <p>{tip.text}</p>
            <button onClick={dismiss} className="text-slate-400 hover:text-white shrink-0 mt-0.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className={`absolute ${tip.position === 'top' ? '-bottom-1' : '-top-1'} right-6 w-2 h-2 bg-slate-800 dark:bg-slate-700 rotate-45`} />
        </div>
      </div>
    </div>
  )
}

export default ContextualTip
