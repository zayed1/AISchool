import { useState, useRef, useCallback } from 'react'

function TextInput({ value, onChange, wordCount }) {
  const isUnderMin = wordCount < 50
  const isOverMax = wordCount > 5000
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  // #6 — Drag & drop file support
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file && file.type === 'text/plain') {
      const reader = new FileReader()
      reader.onload = (event) => {
        onChange(event.target.result)
      }
      reader.readAsText(file, 'UTF-8')
    }
  }, [onChange])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        onChange(event.target.result)
      }
      reader.readAsText(file, 'UTF-8')
    }
  }

  // #10 — Calculate word count percentage for visual indicator
  const progress = Math.min(wordCount / 50, 1)

  return (
    <div className="space-y-2">
      <div
        className={`relative rounded-xl transition-all ${
          isDragging ? 'ring-4 ring-primary-300 border-primary-400' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* #6 — Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-primary-50 bg-opacity-90 rounded-xl z-10 flex items-center justify-center border-2 border-dashed border-primary-400">
            <div className="text-center">
              <svg className="w-10 h-10 text-primary-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-primary-600 font-medium">أفلت الملف هنا</p>
            </div>
          </div>
        )}

        {/* #10 — Responsive textarea */}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="الصق النص هنا للتحقق...  أو اسحب ملف .txt"
          className="w-full min-h-[200px] sm:min-h-[256px] p-4 text-base sm:text-lg leading-relaxed border-2 border-slate-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none resize-y transition-colors bg-white"
          dir="rtl"
        />
      </div>

      <div className="flex flex-wrap justify-between items-center gap-2 text-sm">
        <div className="flex items-center gap-3">
          <span className={`font-medium ${isOverMax ? 'text-red-500' : isUnderMin ? 'text-amber-500' : 'text-green-600'}`}>
            {wordCount} كلمة
            {isUnderMin && wordCount > 0 && ' (الحد الأدنى 50 كلمة)'}
            {isOverMax && ' (تجاوزت الحد الأقصى)'}
          </span>
          {/* Mini progress to 50 words */}
          {wordCount > 0 && wordCount < 50 && (
            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          )}
          {wordCount >= 50 && wordCount <= 5000 && (
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* #6 — File upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-slate-400 hover:text-primary-500 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="text-xs">رفع ملف</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          <span className="text-slate-300">|</span>
          <span className="text-slate-400 text-xs">الحد: 50 - 5000 كلمة</span>
        </div>
      </div>
    </div>
  )
}

export default TextInput
