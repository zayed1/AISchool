import { useState, useRef, useCallback, useEffect } from 'react'
import { countWords } from '../utils/debounce'

function TextInput({ value, onChange, wordCount }) {
  const isUnderMin = wordCount < 50
  const isOverMax = wordCount > 5000
  const [isDragging, setIsDragging] = useState(false)
  const [urlMode, setUrlMode] = useState(false)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  // #18 — Auto-focus textarea on mount
  useEffect(() => {
    const timer = setTimeout(() => textareaRef.current?.focus(), 300)
    return () => clearTimeout(timer)
  }, [])

  // #15 — Auto-expand textarea
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      const minH = window.innerWidth < 640 ? 200 : 256
      el.style.height = Math.max(minH, el.scrollHeight) + 'px'
    }
  }, [value])

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

  const readFile = useCallback((file) => {
    // #14 — Support .txt, .docx (basic), .pdf (basic)
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const reader = new FileReader()
      reader.onload = (event) => onChange(event.target.result)
      reader.readAsText(file, 'UTF-8')
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.endsWith('.docx')
    ) {
      // Basic .docx reading — extract text content from document.xml
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const JSZip = (await import('jszip')).default
          const zip = await JSZip.loadAsync(event.target.result)
          const docXml = await zip.file('word/document.xml')?.async('string')
          if (docXml) {
            // Strip XML tags to get plain text
            const text = docXml
              .replace(/<w:p[^>]*>/g, '\n')
              .replace(/<[^>]+>/g, '')
              .replace(/\n{3,}/g, '\n\n')
              .trim()
            onChange(text)
          }
        } catch {
          // Fallback: try reading as text
          onChange('تعذر قراءة ملف Word. يرجى نسخ النص يدوياً.')
        }
      }
      reader.readAsArrayBuffer(file)
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // #5 — Enhanced PDF reading with pdf.js
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const pdfjsLib = await import('pdfjs-dist/build/pdf.min.mjs')
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
          const pdf = await pdfjsLib.getDocument({ data: event.target.result }).promise
          const pages = []
          for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
            const page = await pdf.getPage(i)
            const content = await page.getTextContent()
            pages.push(content.items.map((item) => item.str).join(' '))
          }
          const text = pages.join('\n\n').trim()
          if (text.length < 20) {
            onChange('تعذر استخراج النص من PDF — قد يكون الملف عبارة عن صور. يرجى نسخ النص يدوياً.')
          } else {
            onChange(text)
          }
        } catch {
          onChange('تعذر قراءة ملف PDF. يرجى نسخ النص من الملف ولصقه هنا.')
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      onChange('صيغة الملف غير مدعومة. الصيغ المدعومة: .txt، .docx')
    }
  }, [onChange])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) readFile(file)
  }, [readFile])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) readFile(file)
  }

  const progress = Math.min(wordCount / 50, 1)

  return (
    <div className="space-y-2">
      <div
        className={`relative rounded-xl transition-all ${
          isDragging ? 'ring-4 ring-primary-300 dark:ring-primary-700 border-primary-400' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-primary-50 dark:bg-primary-900/30 bg-opacity-90 rounded-xl z-10 flex items-center justify-center border-2 border-dashed border-primary-400 dark:border-primary-600">
            <div className="text-center">
              <svg className="w-10 h-10 text-primary-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-primary-600 dark:text-primary-400 font-medium">أفلت الملف هنا</p>
            </div>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="الصق النص هنا للتحقق... أو اسحب ملف (.txt، .docx)"
          className="w-full min-h-[200px] sm:min-h-[256px] p-4 text-base sm:text-lg leading-relaxed border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 outline-none resize-none transition-colors bg-white dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
          dir="rtl"
          aria-label="أدخل النص العربي للتحليل"
          role="textbox"
        />
      </div>

      <div className="flex flex-wrap justify-between items-center gap-2 text-sm">
        <div className="flex items-center gap-3">
          <span className={`font-medium ${isOverMax ? 'text-red-500' : isUnderMin ? 'text-amber-500' : 'text-green-600 dark:text-green-400'}`}>
            {wordCount} كلمة
            {isUnderMin && wordCount > 0 && ' (الحد الأدنى 50 كلمة)'}
            {isOverMax && ' (تجاوزت الحد الأقصى)'}
          </span>
          {wordCount > 0 && wordCount < 50 && (
            <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden" aria-hidden="true">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          )}
          {wordCount >= 50 && wordCount <= 5000 && (
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-slate-400 hover:text-primary-500 dark:text-slate-500 dark:hover:text-primary-400 transition-colors flex items-center gap-1"
            aria-label="رفع ملف نصي"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="text-xs">رفع ملف</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.docx,.pdf"
            onChange={handleFileSelect}
            className="hidden"
            aria-hidden="true"
          />
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="text-slate-400 dark:text-slate-500 text-xs">الحد: 50 - 5000 كلمة</span>
        </div>
      </div>
    </div>
  )
}

export default TextInput
