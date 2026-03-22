// Word counter tool — standalone quick calculator
import { useState, useMemo } from 'react'

function WordCounter({ onClose }) {
  const [text, setText] = useState('')

  const stats = useMemo(() => {
    if (!text.trim()) return null
    const chars = text.length
    const charsNoSpace = text.replace(/\s/g, '').length
    const words = text.trim().split(/\s+/).length
    const sentences = text.split(/[.!?\u061F\u0964\u06D4]+/).filter((s) => s.trim()).length
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length
    const lines = text.split('\n').length
    const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length
    const readingTime = Math.max(1, Math.ceil(words / 200))
    const speakingTime = Math.max(1, Math.ceil(words / 130))

    return { chars, charsNoSpace, words, sentences, paragraphs, lines, arabicChars, readingTime, speakingTime }
  }, [text])

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">حاسبة النص</h2>
        <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="الصق أو اكتب النص هنا..."
        className="w-full min-h-[180px] p-4 text-base leading-relaxed border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-slate-100 outline-none focus:border-primary-500 resize-y"
        dir="rtl"
      />

      {stats && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {[
            { label: 'كلمات', value: stats.words, icon: 'M4 6h16M4 12h16M4 18h7' },
            { label: 'جمل', value: stats.sentences, icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'فقرات', value: stats.paragraphs, icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
            { label: 'أحرف', value: stats.charsNoSpace, icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129' },
            { label: 'أسطر', value: stats.lines, icon: 'M4 6h16M4 12h8m-8 6h16' },
            { label: 'أحرف عربية', value: stats.arabicChars, icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10' },
            { label: 'أحرف + فراغات', value: stats.chars, icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
            { label: 'وقت القراءة', value: `${stats.readingTime} د`, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'وقت الإلقاء', value: `${stats.speakingTime} د`, icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
              <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{s.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {!stats && (
        <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">ابدأ بكتابة أو لصق النص لرؤية الإحصائيات</p>
      )}
    </div>
  )
}

export default WordCounter
