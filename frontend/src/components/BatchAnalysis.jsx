// Batch analysis component — analyze multiple texts/files at once
import { useState, useRef } from 'react'
import { analyzeText } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { countWords } from '../utils/debounce'

function BatchAnalysis({ onClose }) {
  const [texts, setTexts] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const fileInputRef = useRef(null)
  const { addToast } = useToast()

  const addText = () => {
    setTexts([...texts, { id: Date.now(), text: '', name: `نص ${texts.length + 1}` }])
  }

  const updateText = (id, text) => {
    setTexts(texts.map((t) => (t.id === id ? { ...t, text } : t)))
  }

  const removeText = (id) => {
    setTexts(texts.filter((t) => t.id !== id))
  }

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files)
    for (const file of files) {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const content = await file.text()
        setTexts((prev) => [...prev, { id: Date.now() + Math.random(), text: content, name: file.name }])
      }
    }
    e.target.value = ''
  }

  const handleAnalyzeAll = async () => {
    const valid = texts.filter((t) => {
      const wc = countWords(t.text)
      return wc >= 50 && wc <= 5000
    })
    if (valid.length === 0) {
      addToast('لا توجد نصوص صالحة للتحليل (50-5000 كلمة)', 'warning')
      return
    }

    setLoading(true)
    setProgress({ current: 0, total: valid.length })
    const newResults = []

    for (let i = 0; i < valid.length; i++) {
      try {
        const data = await analyzeText(valid[i].text)
        newResults.push({ name: valid[i].name, data, error: null })
      } catch {
        newResults.push({ name: valid[i].name, data: null, error: 'فشل التحليل' })
      }
      setProgress({ current: i + 1, total: valid.length })
    }

    setResults(newResults)
    setLoading(false)
    addToast(`تم تحليل ${newResults.filter((r) => r.data).length}/${valid.length} نصوص`, 'success')
  }

  const exportBatchCSV = () => {
    const header = 'الاسم,النسبة,المستوى,التصنيف,الثقة,الكلمات,الجمل\n'
    const rows = results.filter((r) => r.data).map((r) => {
      const d = r.data
      return `"${r.name}",${d.result.percentage},"${d.result.level}","${d.ml.label}",${Math.round(d.ml.confidence * 100)}%,${d.metadata.word_count},${d.metadata.sentence_count}`
    }).join('\n')
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'batch-analysis.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const colorDot = { red: 'bg-red-400', orange: 'bg-orange-400', yellow: 'bg-yellow-400', lightgreen: 'bg-emerald-400', green: 'bg-green-400' }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">تحليل دفعي</h2>
        <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <p className="text-slate-500 dark:text-slate-400 text-sm text-center">أضف عدة نصوص أو ارفع ملفات .txt لتحليلها دفعة واحدة</p>

      {results.length === 0 ? (
        <>
          {/* Input area */}
          <div className="space-y-3">
            {texts.map((item) => (
              <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{countWords(item.text)} كلمة</span>
                    <button onClick={() => removeText(item.id)} className="text-slate-300 hover:text-red-400 dark:text-slate-600 dark:hover:text-red-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
                <textarea
                  value={item.text}
                  onChange={(e) => updateText(item.id, e.target.value)}
                  placeholder="الصق النص هنا..."
                  className="w-full min-h-[80px] p-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 dark:text-slate-100 outline-none focus:border-primary-400 resize-y"
                  dir="rtl"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={addText} className="flex-1 py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:border-primary-400 hover:text-primary-500 transition-colors">
              + إضافة نص
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:border-primary-400 hover:text-primary-500 transition-colors">
              رفع ملفات .txt
            </button>
            <input ref={fileInputRef} type="file" accept=".txt" multiple onChange={handleFiles} className="hidden" />
          </div>

          {texts.length > 0 && (
            <button
              onClick={handleAnalyzeAll}
              disabled={loading}
              className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white text-lg font-semibold rounded-xl transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  جارٍ التحليل ({progress.current}/{progress.total})...
                </span>
              ) : `تحليل ${texts.length} نصوص`}
            </button>
          )}
        </>
      ) : (
        <>
          {/* Results */}
          <div className="space-y-3">
            {results.map((r, i) => (
              <div key={i} className={`rounded-xl border p-4 ${r.error ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {r.data && <span className={`w-3 h-3 rounded-full ${colorDot[r.data.result.color]}`} />}
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{r.name}</span>
                  </div>
                  {r.data ? (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{r.data.metadata.word_count} كلمة</span>
                      <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{r.data.result.percentage}%</span>
                    </div>
                  ) : (
                    <span className="text-xs text-red-500">{r.error}</span>
                  )}
                </div>
                {r.data && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colorDot[r.data.result.color]}`} style={{ width: `${r.data.result.percentage}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400">{r.data.result.level}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          {results.filter((r) => r.data).length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">ملخص</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                    {Math.round(results.filter((r) => r.data).reduce((s, r) => s + r.data.result.percentage, 0) / results.filter((r) => r.data).length)}%
                  </p>
                  <p className="text-[10px] text-slate-400">المتوسط</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-500">{results.filter((r) => r.data && r.data.result.percentage >= 50).length}</p>
                  <p className="text-[10px] text-slate-400">مشبوه</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-500">{results.filter((r) => r.data && r.data.result.percentage < 50).length}</p>
                  <p className="text-[10px] text-slate-400">بشري</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={exportBatchCSV} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors border border-slate-200 dark:border-slate-600 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              تصدير CSV
            </button>
            <button onClick={() => setResults([])} className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors">
              تحليل جديد
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default BatchAnalysis
