import { useState, useEffect } from 'react'
import ResultCard from '../components/ResultCard'
import IndicatorBar from '../components/IndicatorBar'
import SentenceHighlight from '../components/SentenceHighlight'
import RadarChart from '../components/RadarChart'
import WordHeatmap from '../components/WordHeatmap'
import ScrollReveal from '../components/ScrollReveal'
import { exportReportAsPDF } from '../utils/pdfExport'
import { generateShareLink } from '../utils/share'
import { launchConfetti } from '../utils/confetti'

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
  { id: 'section-radar', label: 'الرادار' },
  { id: 'section-indicators', label: 'المؤشرات' },
  { id: 'section-sentences', label: 'الجمل' },
  { id: 'section-heatmap', label: 'الحرارية' },
]

function Report({ data, onBack }) {
  const { result, statistical, ml, sentences, metadata } = data
  const [copied, setCopied] = useState(false)
  const [activeSection, setActiveSection] = useState('section-result')
  const [shareLink, setShareLink] = useState(null)
  const [showHeatmap, setShowHeatmap] = useState(false)

  // #12 — Confetti on green result
  useEffect(() => {
    if (result.color === 'green' && result.percentage <= 20) {
      setTimeout(() => launchConfetti(), 500)
    }
  }, [result])

  // Track active section on scroll
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

  // Copy report text
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

  // #15 — Share
  const handleShare = async () => {
    const link = generateShareLink(data)
    if (link) {
      try {
        await navigator.clipboard.writeText(link)
        setShareLink('تم نسخ رابط المشاركة!')
        setTimeout(() => setShareLink(null), 3000)
      } catch {
        setShareLink(link)
      }
    }
  }

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-6" role="main" aria-label="تقرير التحليل">
      {/* Cache indicator */}
      {data._fromCache && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 rounded-lg p-2 text-xs text-center">
          نتيجة محفوظة من تحليل سابق لنفس النص
        </div>
      )}

      {/* Section navigation */}
      <nav className="sticky top-0 z-30 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm py-2 -mx-4 px-4 border-b border-slate-200/50 dark:border-slate-700/50" aria-label="تنقل الأقسام">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollTo(section.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeSection === section.id
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              aria-current={activeSection === section.id ? 'true' : undefined}
            >
              {section.label}
            </button>
          ))}

          <div className="flex-1" />

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Share */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="مشاركة التقرير"
              aria-label="مشاركة التقرير"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="hidden sm:inline">مشاركة</span>
            </button>

            {/* PDF */}
            <button
              onClick={() => exportReportAsPDF(data)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="تصدير PDF"
              aria-label="تصدير كملف PDF"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">PDF</span>
            </button>

            {/* Copy */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="نسخ التقرير"
              aria-label="نسخ التقرير كنص"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-600 dark:text-green-400 hidden sm:inline">تم</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">نسخ</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Share link toast */}
        {shareLink && (
          <div className="mt-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded-lg p-2 text-center">
            {shareLink}
          </div>
        )}
      </nav>

      <ScrollReveal>
        <div id="section-result">
          <ResultCard result={result} />
        </div>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">عدد الكلمات</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200">{metadata.word_count}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">عدد الجمل</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200">{metadata.sentence_count}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">زمن التحليل</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200">{metadata.analysis_time_ms} مل‌ث</p>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6" id="section-model">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">نتيجة النموذج</h3>
          <div className="flex items-center gap-4">
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
              ml.label.toUpperCase() === 'AI'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            }`}>
              {ml.label.toUpperCase() === 'AI' ? 'ذكاء اصطناعي' : 'بشري'}
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-sm">الثقة: {Math.round(ml.confidence * 100)}%</span>
          </div>
        </div>
      </ScrollReveal>

      {/* #9 — Radar chart */}
      <ScrollReveal delay={300}>
        <div id="section-radar">
          <RadarChart statistical={statistical} />
        </div>
      </ScrollReveal>

      <ScrollReveal delay={400}>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6" id="section-indicators">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">المؤشرات الإحصائية</h3>
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
      </ScrollReveal>

      {sentences && sentences.length > 0 && (
        <ScrollReveal delay={500}>
          <div id="section-sentences">
            <SentenceHighlight sentences={sentences} />
          </div>
        </ScrollReveal>
      )}

      {/* #11 — Word heatmap toggle */}
      {sentences && sentences.length > 0 && (
        <ScrollReveal delay={600}>
          <div id="section-heatmap">
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className="w-full text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors py-2 flex items-center justify-center gap-2"
            >
              <svg className={`w-4 h-4 transition-transform ${showHeatmap ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {showHeatmap ? 'إخفاء' : 'عرض'} خريطة الكلمات الحرارية
            </button>
            {showHeatmap && <WordHeatmap sentences={sentences} />}
          </div>
        </ScrollReveal>
      )}

      {/* Accuracy disclaimer */}
      <ScrollReveal delay={700}>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed" role="note">
          <div className="flex gap-2">
            <svg className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-slate-600 dark:text-slate-300 mb-1">ملاحظة حول الدقة</p>
              <p>
                هذه الأداة تقدم تقديراً احتمالياً وليست قاطعة. قد تتأثر النتائج بطبيعة النص وأسلوب الكاتب.
                لا ينبغي الاعتماد عليها كدليل وحيد في اتخاذ قرارات أكاديمية أو مهنية.
                يُنصح باستخدامها كأداة مساعدة مع المراجعة البشرية.
              </p>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <button
        onClick={onBack}
        className="w-full py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300 text-slate-700 dark:text-slate-200 text-lg font-semibold rounded-xl transition-all border border-slate-200 dark:border-slate-600 transform active:scale-[0.99]"
        aria-label="العودة لتحليل نص آخر"
      >
        تحقق من نص آخر
      </button>
    </div>
  )
}

export default Report
