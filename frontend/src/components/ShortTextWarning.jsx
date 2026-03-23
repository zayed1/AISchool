// #9 — Short text warning badge
function ShortTextWarning({ wordCount, sentenceCount }) {
  if (!wordCount || wordCount >= 100) return null
  if (wordCount < 50) return null // below minimum, handled elsewhere

  // Only show for 50-99 word texts
  const reliability = wordCount >= 80 ? 'medium' : 'low'
  const meta = {
    low: {
      bg: 'bg-amber-50 dark:bg-amber-900/10',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-400',
      icon: 'text-amber-500',
      message: 'نص قصير جداً — النتيجة أقل موثوقية. أضف المزيد من النص للحصول على تقييم أدق.',
    },
    medium: {
      bg: 'bg-blue-50 dark:bg-blue-900/10',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-400',
      icon: 'text-blue-500',
      message: 'نص قصير نسبياً — قد تتأثر بعض المؤشرات الإحصائية.',
    },
  }

  const m = meta[reliability]

  return (
    <div className={`${m.bg} ${m.border} border rounded-lg p-2.5 flex items-start gap-2`} role="alert">
      <svg className={`w-4 h-4 shrink-0 mt-0.5 ${m.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <p className={`text-xs ${m.text}`}>{m.message}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{wordCount} كلمة — {sentenceCount || '?'} جملة</p>
      </div>
    </div>
  )
}

export default ShortTextWarning
