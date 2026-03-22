function TextInput({ value, onChange, wordCount }) {
  const isUnderMin = wordCount < 50
  const isOverMax = wordCount > 5000

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="الصق النص هنا للتحقق..."
        className="w-full h-64 p-4 text-lg leading-relaxed border-2 border-slate-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none resize-none transition-colors bg-white"
        dir="rtl"
      />
      <div className="flex justify-between items-center text-sm">
        <span className={`font-medium ${isOverMax ? 'text-red-500' : isUnderMin ? 'text-amber-500' : 'text-slate-500'}`}>
          {wordCount} كلمة
          {isUnderMin && wordCount > 0 && ' (الحد الأدنى 50 كلمة)'}
          {isOverMax && ' (تجاوزت الحد الأقصى)'}
        </span>
        <span className="text-slate-400">الحد: 50 - 5000 كلمة</span>
      </div>
    </div>
  )
}

export default TextInput
