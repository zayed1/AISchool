// Text transformer — diacritics removal, number conversion, cleanup
import { useState } from 'react'

const tools = [
  {
    id: 'removeDiacritics',
    label: 'إزالة التشكيل',
    fn: (t) => t.replace(/[\u0617-\u061A\u064B-\u0652]/g, ''),
  },
  {
    id: 'removeExtraSpaces',
    label: 'تنظيف المسافات',
    fn: (t) => t.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim(),
  },
  {
    id: 'removeEmptyLines',
    label: 'إزالة الأسطر الفارغة',
    fn: (t) => t.split('\n').filter((l) => l.trim()).join('\n'),
  },
  {
    id: 'hindiToArabicNums',
    label: 'أرقام هندية → عربية',
    fn: (t) => t.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()),
  },
  {
    id: 'arabicToHindiNums',
    label: 'أرقام عربية → هندية',
    fn: (t) => t.replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]),
  },
  {
    id: 'removePunctuation',
    label: 'إزالة علامات الترقيم',
    fn: (t) => t.replace(/[.,،؛:!?؟\-\(\)\[\]{}«»"'"'…]/g, ''),
  },
  {
    id: 'normalizeAlef',
    label: 'توحيد الألف',
    fn: (t) => t.replace(/[إأآ]/g, 'ا'),
  },
  {
    id: 'normalizeTaMarbuta',
    label: 'تحويل ه → ة',
    fn: (t) => {
      // Only at end of Arabic words (rough heuristic)
      return t.replace(/([\u0600-\u06FF])ه(\s|$)/g, '$1ة$2')
    },
  },
]

function TextTransformer({ onClose }) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  const applyTool = (fn) => {
    const src = input || ''
    const result = fn(src)
    setOutput(result)
  }

  const applyAll = () => {
    let result = input
    tools.forEach((t) => { result = t.fn(result) })
    setOutput(result)
  }

  const copyOutput = () => {
    navigator.clipboard.writeText(output).catch(() => {})
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">محوّل النص</h2>
        <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="الصق النص هنا..."
        className="w-full min-h-[120px] p-3 text-sm border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-slate-100 outline-none focus:border-primary-500 resize-y"
        dir="rtl"
      />

      <div className="flex flex-wrap gap-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => applyTool(tool.fn)}
            disabled={!input.trim()}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-600 dark:hover:text-primary-400 disabled:opacity-40 transition-colors"
          >
            {tool.label}
          </button>
        ))}
        <button
          onClick={applyAll}
          disabled={!input.trim()}
          className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-medium transition-colors"
        >
          تطبيق الكل
        </button>
      </div>

      {output && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">النتيجة:</label>
            <button onClick={copyOutput} className="text-xs text-primary-500 hover:text-primary-600 transition-colors">نسخ</button>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
            {output}
          </div>
        </div>
      )}
    </div>
  )
}

export default TextTransformer
