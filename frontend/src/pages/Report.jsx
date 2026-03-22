import { useState, useEffect } from 'react'
import ResultCard from '../components/ResultCard'
import IndicatorBar from '../components/IndicatorBar'
import SentenceHighlight from '../components/SentenceHighlight'

const indicatorLabels = {
  ttr: 'تنوع المفردات',
  sentence_length_cv: 'تباين أطوال الجمل',
  repetitive_openers_ratio: 'تكرار العبارات الافتتاحية',
  connector_density: 'كثافة أدوات الربط',
  error_ratio: 'نسبة الأخطاء',
  burstiness: 'الانفجارية',
}

const indicatorMaxValues = {
  ttr: 1,
  sentence_length_cv: 1,
  repetitive_openers_ratio: 0.5,
  connector_density: 4,
  error_ratio: 0.05,
  burstiness: 1,
}

const sections = [
  { id: 'section-result', label: 'النتيجة' },
  { id: 'section-model', label: 'النموذج' },
  { id: 'section-indicators', label: 'المؤشرات' },
  { id: 'section-sentences', label: 'الجمل' },
]

function Report({ data, onBack }) {
  const { result, statistical, ml, sentences, metadata } = data
  const [copied, setCopied] = useState(false)
  const [activeSection, setActiveSection] = useState('section-result')

  // #7 — Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      for (const section of sections) {
        const el = document.getElementById(section.id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 150 && rect.bottom > 150) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // #5 — Copy report text
  const handleCopy = async () => {
    const report = `تقرير كشف النص المولد بالذكاء الاصطناعي
━━━━━━━━━━━━━━━━━━━━━━━━
النتيجة: ${result.percentage}% — ${result.level}

المؤشرات الإحصائية:
• تنوع المفردات: ${Math.round(statistical.ttr * 100)}%
• تباين أطوال الجمل: ${Math.round(statistical.sentence_length_cv * 100)}%
• تكرار العبارات الافتتاحية: ${Math.round(statistical.repetitive_openers_ratio * 200)}%
• كثافة أدوات الربط: ${Math.round((statistical.connector_density / 4) * 100)}%
• نسبة الأخطاء: ${Math.round((statistical.error_ratio / 0.05) * 100)}%
• الانفجارية: ${Math.round(statistical.burstiness * 100)}%

نتيجة النموذج: ${ml.label.toUpperCase() === 'AI' ? 'ذكاء اصطناعي' : 'بشري'} (الثقة: ${Math.round(ml.confidence * 100)}%)

عدد الكلمات: ${metadata.word_count} | عدد الجمل: ${metadata.sentence_count}
━━━━━━━━━━━━━━━━━━━━━━━━
كاشف النصوص العربية المولدة بالذكاء الاصطناعي`

    try {
      await navigator.clipboard.writeText(report)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-6">
      {/* #7 — Section navigation */}
      <div className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-sm py-2 -mx-4 px-4 border-b border-slate-200/50">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollTo(section.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeSection === section.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {section.label}
            </button>
          ))}

          <div className="flex-1" />

          {/* #5 — Copy button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-600">تم النسخ</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>نسخ التقرير</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div id="section-result">
        <ResultCard result={result} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-slate-500">عدد الكلمات</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-800">{metadata.word_count}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-slate-500">عدد الجمل</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-800">{metadata.sentence_count}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-slate-500">زمن التحليل</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-800">{metadata.analysis_time_ms} مل‌ث</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6" id="section-model">
        <h3 className="text-lg font-bold text-slate-800 mb-2">نتيجة النموذج</h3>
        <div className="flex items-center gap-4">
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
            ml.label.toUpperCase() === 'AI'
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}>
            {ml.label.toUpperCase() === 'AI' ? 'ذكاء اصطناعي' : 'بشري'}
          </span>
          <span className="text-slate-500 text-sm">الثقة: {Math.round(ml.confidence * 100)}%</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6" id="section-indicators">
        <h3 className="text-lg font-bold text-slate-800 mb-4">المؤشرات الإحصائية</h3>
        <div className="space-y-5">
          {Object.entries(indicatorLabels).map(([key, label]) => (
            <IndicatorBar
              key={key}
              label={label}
              value={statistical[key]}
              maxValue={indicatorMaxValues[key]}
            />
          ))}
        </div>
      </div>

      {sentences && sentences.length > 0 && (
        <SentenceHighlight sentences={sentences} />
      )}

      {/* #9 — Accuracy disclaimer */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-sm text-slate-500 leading-relaxed">
        <div className="flex gap-2">
          <svg className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium text-slate-600 mb-1">ملاحظة حول الدقة</p>
            <p>
              هذه الأداة تقدم تقديراً احتمالياً وليست قاطعة. قد تتأثر النتائج بطبيعة النص وأسلوب الكاتب.
              لا ينبغي الاعتماد عليها كدليل وحيد في اتخاذ قرارات أكاديمية أو مهنية.
              يُنصح باستخدامها كأداة مساعدة مع المراجعة البشرية.
            </p>
          </div>
        </div>
      </div>

      {/* #10 — Larger touch target */}
      <button
        onClick={onBack}
        className="w-full py-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-lg font-semibold rounded-xl transition-all border border-slate-200 transform active:scale-[0.99]"
      >
        تحقق من نص آخر
      </button>
    </div>
  )
}

export default Report
