// #7 — User feedback after analysis (thumbs up/down + optional comment)
import { useState } from 'react'

function UserFeedback({ resultId, resultScore }) {
  const [feedback, setFeedback] = useState(null) // 'accurate' | 'inaccurate'
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (type) => {
    setFeedback(type)

    // Save to localStorage
    try {
      const history = JSON.parse(localStorage.getItem('user_feedback') || '[]')
      history.unshift({
        type,
        comment: comment.trim(),
        score: resultScore,
        date: new Date().toLocaleDateString('ar-SA'),
        timestamp: Date.now(),
      })
      // Keep last 50
      localStorage.setItem('user_feedback', JSON.stringify(history.slice(0, 50)))
    } catch {}

    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  if (submitted) {
    return (
      <div className="bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-800 p-4 text-center">
        <svg className="w-8 h-8 text-green-500 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <p className="text-sm text-green-700 dark:text-green-400 font-medium">شكراً لملاحظتك!</p>
        <p className="text-xs text-green-600 dark:text-green-500 mt-1">تساعدنا في تحسين دقة الأداة</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 text-center">هل كانت النتيجة دقيقة؟</h4>

      <div className="flex items-center justify-center gap-4 mb-3">
        <button
          onClick={() => handleSubmit('accurate')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 transition-all ${
            feedback === 'accurate'
              ? 'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'border-slate-200 dark:border-slate-600 hover:border-green-300 dark:hover:border-green-700 text-slate-600 dark:text-slate-400'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          <span className="text-sm font-medium">نعم، دقيقة</span>
        </button>

        <button
          onClick={() => handleSubmit('inaccurate')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 transition-all ${
            feedback === 'inaccurate'
              ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              : 'border-slate-200 dark:border-slate-600 hover:border-red-300 dark:hover:border-red-700 text-slate-600 dark:text-slate-400'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
          </svg>
          <span className="text-sm font-medium">لا، غير دقيقة</span>
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="تعليق اختياري..."
          className="flex-1 text-xs px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 outline-none focus:border-primary-400"
          dir="rtl"
          maxLength={200}
        />
      </div>
    </div>
  )
}

export default UserFeedback
