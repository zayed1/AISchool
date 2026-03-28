// Teacher mode — analyze multiple student submissions
import { useState, useRef } from 'react'
import { analyzeText } from '../services/api'
import { saveToHistory } from './HistoryPanel'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { countWords } from '../utils/debounce'

function TeacherMode({ onClose }) {
  const [className, setClassName] = useState('')
  const [students, setStudents] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const fileInputRef = useRef(null)
  const { addToast } = useToast()
  const { recordLocalUsage } = useAuth()

  const addStudent = () => {
    setStudents([...students, { id: Date.now(), name: '', text: '' }])
  }

  const updateStudent = (id, field, value) => {
    setStudents(students.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const removeStudent = (id) => {
    setStudents(students.filter((s) => s.id !== id))
  }

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files)
    for (const file of files) {
      if (file.name.endsWith('.txt')) {
        const content = await file.text()
        const name = file.name.replace('.txt', '')
        setStudents((prev) => [...prev, { id: Date.now() + Math.random(), name, text: content }])
      }
    }
    e.target.value = ''
  }

  const handleAnalyze = async () => {
    // Validate all students and show specific errors
    const issues = []
    students.forEach((s, i) => {
      const wc = countWords(s.text)
      if (!s.name.trim()) issues.push(`الطالب ${i + 1}: الاسم مطلوب`)
      else if (wc < 50) issues.push(`${s.name}: النص قصير (${wc} كلمة، الحد الأدنى 50)`)
      else if (wc > 5000) issues.push(`${s.name}: النص طويل (${wc} كلمة، الحد الأقصى 5000)`)
    })

    if (issues.length > 0) {
      addToast(issues[0], 'warning', 5000)
      return
    }

    if (students.length === 0) {
      addToast('أضف طالباً واحداً على الأقل', 'warning')
      return
    }

    setLoading(true)
    setProgress({ current: 0, total: students.length })
    const newResults = []

    for (let i = 0; i < students.length; i++) {
      setProgress({ current: i + 1, total: students.length })
      try {
        const data = await analyzeText(students[i].text)
        newResults.push({ name: students[i].name, data, error: null, wordCount: countWords(students[i].text) })

        // Save to history
        try {
          saveToHistory(data, students[i].text)
        } catch {}

        recordLocalUsage()
      } catch (err) {
        const detail = err.response?.data?.detail
        const msg = typeof detail === 'string' ? detail : detail?.message || 'فشل التحليل'
        newResults.push({ name: students[i].name, data: null, error: msg, wordCount: countWords(students[i].text) })
      }
    }

    setResults(newResults)
    setLoading(false)

    const successCount = newResults.filter(r => r.data).length
    const failCount = newResults.length - successCount
    if (failCount > 0) {
      addToast(`تم تحليل ${successCount} من ${newResults.length} (${failCount} فشل)`, 'warning')
    } else {
      addToast('تم تحليل جميع الواجبات', 'success')
    }
  }

  const exportClassReport = () => {
    const successResults = results.filter((r) => r.data)
    const avgPct = successResults.length > 0 ? Math.round(successResults.reduce((s, r) => s + r.data.result.percentage, 0) / successResults.length) : 0
    const suspicious = successResults.filter((r) => r.data.result.percentage >= 50)

    let report = `تقرير صفي — ${className || 'بدون اسم'}\n`
    report += `التاريخ: ${new Date().toLocaleDateString('ar-EG')}\n`
    report += `${'━'.repeat(40)}\n\n`
    report += `إجمالي الطلاب: ${successResults.length}\n`
    report += `متوسط نسبة AI: ${avgPct}%\n`
    report += `نصوص مشبوهة: ${suspicious.length}\n\n`
    report += `${'━'.repeat(40)}\n`
    report += `الطالب\tالنسبة\tالمستوى\tالكلمات\n`
    report += `${'─'.repeat(40)}\n`

    successResults
      .sort((a, b) => b.data.result.percentage - a.data.result.percentage)
      .forEach((r) => {
        const flag = r.data.result.percentage >= 65 ? '⚠️' : r.data.result.percentage >= 45 ? '⚡' : '✓'
        report += `${r.name}\t${r.data.result.percentage}% ${flag}\t${r.data.result.level}\t${r.wordCount}\n`
      })

    report += `\n${'━'.repeat(40)}\nملاحظة: النتائج تقديرية وليست قاطعة`

    const blob = new Blob(['\uFEFF' + report], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `class-report-${className || 'unnamed'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const colorDot = { red: 'bg-red-400', orange: 'bg-orange-400', yellow: 'bg-yellow-400', lightgreen: 'bg-emerald-400', green: 'bg-green-400' }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">وضع المعلم</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">تحليل واجبات الطلاب مع تقرير صفي شامل</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {results.length === 0 ? (
        <>
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="اسم الصف / المادة (اختياري)"
            className="w-full px-4 py-2.5 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-slate-100 outline-none focus:border-primary-500"
          />

          <div className="space-y-3">
            {students.map((s, i) => {
              const wc = countWords(s.text)
              const hasIssue = (s.name.trim() === '' && s.text.trim() !== '') || (wc > 0 && wc < 50)
              return (
                <div key={s.id} className={`bg-white dark:bg-slate-800 rounded-xl border p-3 ${hasIssue ? 'border-amber-300 dark:border-amber-700' : 'border-slate-200 dark:border-slate-700'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-slate-400 w-6">{i + 1}</span>
                    <input
                      type="text"
                      value={s.name}
                      onChange={(e) => updateStudent(s.id, 'name', e.target.value)}
                      placeholder="اسم الطالب *"
                      className={`flex-1 px-3 py-1.5 text-sm border rounded-lg bg-slate-50 dark:bg-slate-700 dark:text-slate-100 outline-none focus:border-primary-400 ${!s.name.trim() && s.text.trim() ? 'border-amber-400' : 'border-slate-200 dark:border-slate-600'}`}
                    />
                    <span className={`text-xs ${wc > 0 && wc < 50 ? 'text-amber-500' : wc >= 50 ? 'text-green-500' : 'text-slate-400'}`}>{wc} كلمة</span>
                    <button onClick={() => removeStudent(s.id)} className="text-slate-300 hover:text-red-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <textarea
                    value={s.text}
                    onChange={(e) => updateStudent(s.id, 'text', e.target.value)}
                    placeholder="الصق نص الواجب..."
                    className="w-full min-h-[60px] p-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 dark:text-slate-100 outline-none resize-y"
                    dir="rtl"
                  />
                  {hasIssue && (
                    <p className="text-[10px] text-amber-500 mt-1">
                      {!s.name.trim() ? 'الاسم مطلوب' : `${50 - wc} كلمة إضافية مطلوبة`}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex gap-2">
            <button onClick={addStudent} className="flex-1 py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-500 hover:border-primary-400 hover:text-primary-500 transition-colors">
              + إضافة طالب
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-500 hover:border-primary-400 hover:text-primary-500 transition-colors">
              رفع ملفات (اسم_الطالب.txt)
            </button>
            <input ref={fileInputRef} type="file" accept=".txt" multiple onChange={handleFiles} className="hidden" />
          </div>

          {students.length > 0 && (
            <button onClick={handleAnalyze} disabled={loading} className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white text-lg font-semibold rounded-xl transition-colors">
              {loading ? `جارٍ التحليل (${progress.current}/${progress.total})...` : `تحليل ${students.length} واجبات`}
            </button>
          )}
        </>
      ) : (
        <>
          {/* Class summary */}
          <div className="bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-200 dark:border-primary-800 p-4">
            <h3 className="font-bold text-primary-700 dark:text-primary-400 mb-2">{className || 'التقرير الصفي'}</h3>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div><p className="text-xl font-bold text-slate-700 dark:text-slate-200">{results.filter((r) => r.data).length}</p><p className="text-[10px] text-slate-400">طلاب</p></div>
              <div>
                <p className="text-xl font-bold text-slate-700 dark:text-slate-200">
                  {results.filter((r) => r.data).length > 0 ? Math.round(results.filter((r) => r.data).reduce((s, r) => s + r.data.result.percentage, 0) / results.filter((r) => r.data).length) : 0}%
                </p>
                <p className="text-[10px] text-slate-400">المتوسط</p>
              </div>
              <div><p className="text-xl font-bold text-red-500">{results.filter((r) => r.data && r.data.result.percentage >= 50).length}</p><p className="text-[10px] text-slate-400">مشبوه</p></div>
              <div><p className="text-xl font-bold text-green-500">{results.filter((r) => r.data && r.data.result.percentage < 50).length}</p><p className="text-[10px] text-slate-400">سليم</p></div>
            </div>
          </div>

          {/* Failed analyses */}
          {results.some(r => r.error) && (
            <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
              {results.filter(r => r.error).map((r, i) => (
                <p key={i}>{r.name}: {r.error}</p>
              ))}
            </div>
          )}

          {/* Student results sorted by score */}
          <div className="space-y-2">
            {[...results].filter((r) => r.data).sort((a, b) => b.data.result.percentage - a.data.result.percentage).map((r, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${colorDot[r.data.result.color]}`} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{r.name}</span>
                    {r.data.result.percentage >= 65 && <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded">تحقق</span>}
                  </div>
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{r.data.result.percentage}%</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colorDot[r.data.result.color]}`} style={{ width: `${r.data.result.percentage}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400">{r.wordCount} كلمة</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={exportClassReport} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors border border-slate-200 dark:border-slate-600">
              تصدير التقرير
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

export default TeacherMode
