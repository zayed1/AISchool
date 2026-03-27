import { useState, useEffect, useRef, memo, lazy, Suspense } from 'react'
import ResultCard from '../components/ResultCard'
import IndicatorBar from '../components/IndicatorBar'
import CollapsibleSection from '../components/CollapsibleSection'

// #25 — Lazy load heavy components
const SentenceHighlight = lazy(() => import('../components/SentenceHighlight'))
const RadarChart = lazy(() => import('../components/RadarChart'))
const WordHeatmap = lazy(() => import('../components/WordHeatmap'))
import ScrollReveal from '../components/ScrollReveal'
import WhyThisResult from '../components/WhyThisResult'
import ParagraphAnalysis from '../components/ParagraphAnalysis'
import VerificationBadge from '../components/VerificationBadge'
import QRCodeBadge from '../components/QRCodeBadge'
import ModelDetection from '../components/ModelDetection'
import StyleAnalysis from '../components/StyleAnalysis'
import ConfidenceRing from '../components/ConfidenceRing'
import AverageComparison from '../components/AverageComparison'
import ExecutiveSummary from '../components/ExecutiveSummary'
import RepetitionDetector from '../components/RepetitionDetector'
import QuoteExtractor from '../components/QuoteExtractor'
const WordFrequencyCloud = lazy(() => import('../components/WordFrequencyCloud'))
import MixedTextDetector from '../components/MixedTextDetector'
import StyleMixDetector from '../components/StyleMixDetector'
import ParaphraseDetector from '../components/ParaphraseDetector'
import ReliabilityMeter from '../components/ReliabilityMeter'
import Recommendations from '../components/Recommendations'
import AnalysisTimeline from '../components/AnalysisTimeline'
const ParagraphHeatmap = lazy(() => import('../components/ParagraphHeatmap'))
import TemplateDetector from '../components/TemplateDetector'
import CreativityScore from '../components/CreativityScore'
import UserFeedback from '../components/UserFeedback'
import EmbedBadge from '../components/EmbedBadge'
import CompareShare from '../components/CompareShare'
import ConfidenceInterval from '../components/ConfidenceInterval'
import ShortTextWarning from '../components/ShortTextWarning'
import LanguageBreakdown from '../components/LanguageBreakdown'
import { exportReportAsPDF } from '../utils/pdfExport'
import { exportReportAsPNG, shareReportAsImage } from '../utils/pngExport'
import { exportReportAsDOCX } from '../utils/docxExport'
import { generateShareLink } from '../utils/share'
import { launchConfetti } from '../utils/confetti'
import { useToast } from '../contexts/ToastContext'
import ProGate from '../components/ProGate'

const PresentationMode = lazy(() => import('../components/PresentationMode'))

const MemoParagraphAnalysis = memo(ParagraphAnalysis)
const LazyFallback = <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />

// #51 — CountUp animation component
function CountUp({ end, suffix = '', duration = 1000 }) {
  const [value, setValue] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || localStorage.getItem('reduced_motion') === 'true'
    if (prefersReduced) { setValue(end); return }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const startTime = performance.now()
        const animate = (now) => {
          const progress = Math.min((now - startTime) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setValue(Math.round(eased * end))
          if (progress < 1) requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
      }
    }, { threshold: 0.3 })

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])

  return <span ref={ref}>{value}{suffix}</span>
}

// #54 — Inline text heatmap showing sentence-level AI probability
function TextHeatmap({ sentences }) {
  const [expanded, setExpanded] = useState(false)
  if (!sentences?.length) return null
  const shown = expanded ? sentences : sentences.slice(0, 8)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        خريطة النص الحرارية
      </h3>
      <div className="leading-[2.2] text-sm" dir="rtl" role="region" aria-label="خريطة حرارية تظهر احتمال الذكاء الاصطناعي لكل جملة">
        {shown.map((s, i) => {
          const score = s.score
          const r = score >= 0.5 ? 255 : Math.round(score * 2 * 255)
          const g = score <= 0.5 ? 200 : Math.round((1 - score) * 2 * 200)
          const bg = `rgba(${r}, ${g}, 80, 0.15)`
          const border = `rgba(${r}, ${g}, 80, 0.4)`
          return (
            <span
              key={i}
              className="inline rounded px-1 py-0.5 mx-0.5 border transition-colors cursor-default"
              style={{ backgroundColor: bg, borderColor: border }}
              title={`${Math.round(score * 100)}% احتمال AI`}
              aria-label={`${s.text} — ${Math.round(score * 100)}% احتمال ذكاء اصطناعي`}
            >
              {s.text}
            </span>
          )
        })}
        {!expanded && sentences.length > 8 && (
          <button onClick={() => setExpanded(true)} className="inline-block text-xs text-primary-500 hover:text-primary-600 mr-2 font-medium">
            عرض الكل ({sentences.length} جملة)
          </button>
        )}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-400" aria-hidden="true">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{background: 'rgba(0,200,80,0.2)', border: '1px solid rgba(0,200,80,0.4)'}} /> بشري</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{background: 'rgba(255,200,80,0.2)', border: '1px solid rgba(255,200,80,0.4)'}} /> محتمل</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{background: 'rgba(255,0,80,0.15)', border: '1px solid rgba(255,0,80,0.4)'}} /> اصطناعي</span>
      </div>
    </div>
  )
}

const indicatorLabels = {
  ttr: 'تنوع المفردات',
  sentence_length_cv: 'تباين أطوال الجمل',
  repetitive_openers_ratio: 'تكرار العبارات الافتتاحية',
  connector_density: 'كثافة أدوات الربط',
  error_ratio: 'نسبة الأخطاء',
  burstiness: 'الانفجارية',
  opener_diversity: 'تنوع بدايات الجمل',
  subordinate_ratio: 'نسبة الجمل الفرعية',
  passive_ratio: 'نسبة المبني للمجهول',
}

const indicatorMaxValues = {
  ttr: 1, sentence_length_cv: 1, repetitive_openers_ratio: 0.5,
  connector_density: 4, error_ratio: 0.05, burstiness: 1,
  opener_diversity: 1, subordinate_ratio: 0.5, passive_ratio: 0.1,
}

const sections = [
  { id: 'section-result', label: 'النتيجة' },
  { id: 'section-why', label: 'لماذا؟' },
  { id: 'section-model', label: 'النموذج' },
  { id: 'section-style', label: 'الأسلوب' },
  { id: 'section-radar', label: 'الرادار' },
  { id: 'section-indicators', label: 'المؤشرات' },
  { id: 'section-paragraphs', label: 'الفقرات' },
  { id: 'section-sentences', label: 'الجمل' },
]

function Report({ data, onBack, onUpgrade }) {
  const { result, statistical, ml, sentences, metadata } = data
  const [copied, setCopied] = useState(false)
  const [copyAnim, setCopyAnim] = useState(false)
  const [activeSection, setActiveSection] = useState('section-result')
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showPresentation, setShowPresentation] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false) // #18
  const { addToast } = useToast()

  // #37 — Enhanced confetti: strong for ≤20%, normal for ≤35% green
  useEffect(() => {
    if (result.color === 'green') {
      if (result.percentage <= 20) {
        setTimeout(() => launchConfetti('strong'), 500)
      } else if (result.percentage <= 35) {
        setTimeout(() => launchConfetti('light'), 500)
      }
    }
  }, [result])

  useEffect(() => {
    const handleScroll = () => {
      for (const section of sections) {
        const el = document.getElementById(section.id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 150 && rect.bottom > 150) { setActiveSection(section.id); break }
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleCopy = async () => {
    const report = `تقرير كشف النص المولد بالذكاء الاصطناعي\n━━━━━━━━━━━━━━━━━━━━━━━━\nالنتيجة: ${result.percentage}% — ${result.level}\n\nالمؤشرات: TTR ${Math.round(statistical.ttr*100)}% | CV ${Math.round(statistical.sentence_length_cv*100)}% | Openers ${Math.round(statistical.repetitive_openers_ratio*200)}%\nConnectors ${Math.round((statistical.connector_density/4)*100)}% | Errors ${Math.round((statistical.error_ratio/0.05)*100)}% | Burstiness ${Math.round(statistical.burstiness*100)}%\n\nML: ${ml.label.toUpperCase() === 'AI' ? 'AI' : 'بشري'} (${Math.round(ml.confidence*100)}%)\nكلمات: ${metadata.word_count} | جمل: ${metadata.sentence_count}\n━━━━━━━━━━━━━━━━━━━━━━━━`
    try {
      await navigator.clipboard.writeText(report)
      setCopied(true)
      setCopyAnim(true)
      addToast('تم نسخ التقرير', 'success')
      setTimeout(() => setCopyAnim(false), 600)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleShare = async () => {
    const link = generateShareLink(data)
    if (link) {
      try { await navigator.clipboard.writeText(link); addToast('تم نسخ رابط المشاركة!', 'success') }
      catch { addToast('تعذر نسخ الرابط', 'error') }
    }
  }

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // F11 for presentation mode
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F11') { e.preventDefault(); setShowPresentation(true) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const fullText = sentences?.map((s) => s.text).join('. ') || ''

  if (showPresentation) {
    return (
      <Suspense fallback={null}>
        <PresentationMode data={data} onExit={() => setShowPresentation(false)} />
      </Suspense>
    )
  }

  return (
    <div className="space-y-6" role="main" aria-label="تقرير التحليل">
      {/* #61 — Screen reader summary */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        نتيجة التحليل: {result.percentage} بالمئة احتمال ذكاء اصطناعي.
        التصنيف: {result.level}.
        النموذج: {ml.label.toUpperCase() === 'AI' ? 'ذكاء اصطناعي' : 'بشري'} بثقة {Math.round(ml.confidence * 100)} بالمئة.
        عدد الكلمات: {metadata.word_count}. عدد الجمل: {metadata.sentence_count}.
      </div>
      {data._fromCache && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 rounded-lg p-2 text-xs text-center no-print">
          نتيجة محفوظة من تحليل سابق لنفس النص
        </div>
      )}

      <nav className="sticky top-0 z-30 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm py-2 -mx-4 px-4 border-b border-slate-200/50 dark:border-slate-700/50 no-print" aria-label="تنقل الأقسام">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {/* #18 — Mobile hamburger */}
          <div className="sm:hidden relative">
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="قائمة الأقسام"
              aria-expanded={mobileNavOpen}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            {mobileNavOpen && (
              <div className="absolute top-full right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-40 min-w-36">
                {sections.map((s) => (
                  <button key={s.id} onClick={() => { scrollTo(s.id); setMobileNavOpen(false) }}
                    className={`w-full text-right px-4 py-2 text-sm transition-colors ${activeSection === s.id ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  >{s.label}</button>
                ))}
              </div>
            )}
          </div>
          {/* Desktop section buttons */}
          <div className="hidden sm:flex items-center gap-1">
            {sections.map((s) => (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${activeSection === s.id ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >{s.label}</button>
            ))}
          </div>
          {/* Mobile: current section indicator */}
          <span className="sm:hidden text-xs font-medium text-primary-600 dark:text-primary-400">
            {sections.find((s) => s.id === activeSection)?.label}
            <span className="text-slate-400 mr-1">({sections.findIndex((s) => s.id === activeSection) + 1}/{sections.length})</span>
          </span>
          <div className="flex-1" />
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={handleShare} className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="مشاركة التقرير">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </button>
            <button onClick={() => { exportReportAsPNG(data); addToast('جارٍ تحميل PNG...', 'info') }} className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="تصدير كصورة PNG">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </button>
            <button onClick={async () => { const r = await shareReportAsImage(data); addToast(r.copied ? 'تم نسخ الصورة للمشاركة!' : 'تم تحميل بطاقة المشاركة', r.copied ? 'success' : 'info') }} className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="مشاركة كبطاقة">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <button onClick={() => exportReportAsPDF(data)} className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="تصدير كملف PDF">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </button>
            <button onClick={() => { exportReportAsDOCX(data); addToast('جارٍ تحميل DOCX...', 'info') }} className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="تصدير كملف Word">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </button>
            <button onClick={() => window.print()} className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="طباعة التقرير">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            </button>
            <button onClick={handleCopy} className={`p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 ${copyAnim ? 'scale-125' : ''}`} aria-label="نسخ التقرير">
              {copied ? <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
            </button>
          </div>
        </div>
      </nav>

      <ScrollReveal><div id="section-result"><ResultCard result={result} /></div></ScrollReveal>

      {/* #9 — Short text warning */}
      <ShortTextWarning wordCount={metadata.word_count} sentenceCount={metadata.sentence_count} />

      {/* #5 — Confidence interval */}
      <ScrollReveal delay={20}><ConfidenceInterval result={result} statistical={statistical} ml={ml} /></ScrollReveal>

      {/* Reliability */}
      <ScrollReveal delay={30}><ReliabilityMeter reliability={metadata?.reliability} result={result} /></ScrollReveal>

      {/* #23 — Language breakdown */}
      {sentences?.length > 0 && <ScrollReveal delay={35}><LanguageBreakdown text={fullText} /></ScrollReveal>}

      {/* #54 — Text heatmap */}
      {sentences?.length > 0 && <ScrollReveal delay={38}><TextHeatmap sentences={sentences} /></ScrollReveal>}

      {/* Mixed text detection */}
      {sentences?.length > 0 && <ScrollReveal delay={40}><MixedTextDetector sentences={sentences} /></ScrollReveal>}

      {/* #88 — Style mix detector (formal vs colloquial) */}
      {sentences?.length > 0 && <ScrollReveal delay={42}><StyleMixDetector sentences={sentences} /></ScrollReveal>}

      {/* #86 — Paraphrase detector */}
      {sentences?.length > 0 && <ScrollReveal delay={44}><ParaphraseDetector sentences={sentences} /></ScrollReveal>}

      {/* #51 — Stats with CountUp animation */}
      <ScrollReveal delay={50}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">عدد الكلمات</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200"><CountUp end={metadata.word_count} /></p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">عدد الجمل</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200"><CountUp end={metadata.sentence_count} /></p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">زمن التحليل</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200"><CountUp end={metadata.analysis_time_ms} suffix=" مل‌ث" /></p>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={100}><div id="section-why"><WhyThisResult statistical={statistical} ml={ml} result={result} /></div></ScrollReveal>

      {/* Executive summary */}
      <ScrollReveal delay={80}>
        <ExecutiveSummary result={result} statistical={statistical} ml={ml} metadata={metadata} />
      </ScrollReveal>

      {/* Model detection + confidence ring */}
      <ScrollReveal delay={120}>
        <div id="section-model" className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">نتيجة النموذج</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${ml.label.toUpperCase() === 'AI' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                  {ml.label.toUpperCase() === 'AI' ? 'ذكاء اصطناعي' : 'بشري'}
                </span>
              </div>
              <ConfidenceRing confidence={ml.confidence} label={ml.label} />
            </div>
          </div>
          <ModelDetection text={fullText} statistical={statistical} ml={ml} />
        </div>
      </ScrollReveal>

      {/* === PREMIUM SECTIONS — gated for free users === */}
      <ProGate onUpgrade={onUpgrade} label="درجة الإبداع وتحليل الأسلوب">
        <ScrollReveal delay={140}><CreativityScore statistical={statistical} sentences={sentences} /></ScrollReveal>
        <ScrollReveal delay={150}><div id="section-style"><StyleAnalysis text={fullText} statistical={statistical} /></div></ScrollReveal>
      </ProGate>

      <ProGate onUpgrade={onUpgrade} label="مقارنة المتوسطات ومخطط الرادار">
        <ScrollReveal delay={180}><AverageComparison statistical={statistical} /></ScrollReveal>
        <ScrollReveal delay={200}><div id="section-radar"><Suspense fallback={LazyFallback}><RadarChart statistical={statistical} /></Suspense></div></ScrollReveal>
      </ProGate>

      <ProGate onUpgrade={onUpgrade} label="المؤشرات الإحصائية التفصيلية">
        <ScrollReveal delay={250}>
          <CollapsibleSection id="section-indicators" title="المؤشرات الإحصائية" primary>
            <div className="space-y-5">
              {Object.entries(indicatorLabels).map(([key, label]) => (
                <IndicatorBar key={key} label={label} value={statistical[key]} maxValue={indicatorMaxValues[key]} />
              ))}
            </div>
          </CollapsibleSection>
        </ScrollReveal>
      </ProGate>

      <ProGate onUpgrade={onUpgrade} label="تحليل الفقرات والجمل">
        {sentences?.length > 0 && <ScrollReveal delay={300}><div id="section-paragraphs"><MemoParagraphAnalysis sentences={sentences} /></div></ScrollReveal>}
        {sentences?.length > 0 && <ScrollReveal delay={310}><Suspense fallback={LazyFallback}><ParagraphHeatmap sentences={sentences} /></Suspense></ScrollReveal>}
        {sentences?.length > 0 && <ScrollReveal delay={315}><TemplateDetector sentences={sentences} /></ScrollReveal>}
        {sentences?.length > 0 && <ScrollReveal delay={320}><RepetitionDetector sentences={sentences} /></ScrollReveal>}
        {sentences?.length > 0 && <ScrollReveal delay={340}><QuoteExtractor sentences={sentences} /></ScrollReveal>}
        {sentences?.length > 0 && <ScrollReveal delay={350}><div id="section-sentences"><Suspense fallback={LazyFallback}><SentenceHighlight sentences={sentences} /></Suspense></div></ScrollReveal>}
        {sentences?.length > 0 && <ScrollReveal delay={370}><Suspense fallback={LazyFallback}><WordFrequencyCloud sentences={sentences} /></Suspense></ScrollReveal>}

        {sentences?.length > 0 && (
          <ScrollReveal delay={400}>
            <button onClick={() => setShowHeatmap(!showHeatmap)} className="w-full text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors py-2 flex items-center justify-center gap-2 no-print">
              <svg className={`w-4 h-4 transition-transform ${showHeatmap ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              {showHeatmap ? 'إخفاء' : 'عرض'} خريطة الكلمات الحرارية التفاعلية
            </button>
            {showHeatmap && <Suspense fallback={LazyFallback}><WordHeatmap sentences={sentences} /></Suspense>}
          </ScrollReveal>
        )}
      </ProGate>

      <ScrollReveal delay={450}>
        <div className="flex flex-wrap gap-3 justify-center no-print">
          <VerificationBadge result={result} />
          <QRCodeBadge data={data} />
          <button onClick={() => setShowPresentation(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 transition-colors text-sm text-slate-600 dark:text-slate-300" title="وضع العرض (F11)">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            عرض تقديمي
          </button>
        </div>
      </ScrollReveal>

      {/* #10 — Recommendations */}
      <ScrollReveal delay={470}><Recommendations result={result} statistical={statistical} metadata={metadata} /></ScrollReveal>

      {/* #7 — User feedback */}
      <ScrollReveal delay={475}><UserFeedback resultScore={result.percentage} /></ScrollReveal>

      {/* #12 — Embed badge */}
      <ScrollReveal delay={478}><EmbedBadge result={result} /></ScrollReveal>

      {/* #10 — Compare share */}
      <ScrollReveal delay={480}><CompareShare /></ScrollReveal>

      {/* #11 — Analysis timeline */}
      <ScrollReveal delay={485}><AnalysisTimeline /></ScrollReveal>

      <ScrollReveal delay={500}>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed" role="note">
          <div className="flex gap-2">
            <svg className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <p className="font-medium text-slate-600 dark:text-slate-300 mb-1">ملاحظة حول الدقة</p>
              <p>هذه الأداة تقدم تقديراً احتمالياً وليست قاطعة. لا ينبغي الاعتماد عليها كدليل وحيد في اتخاذ قرارات أكاديمية أو مهنية.</p>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <button onClick={onBack} className="w-full py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 active:bg-slate-300 text-slate-700 dark:text-slate-200 text-lg font-semibold rounded-xl transition-all border border-slate-200 dark:border-slate-600 transform active:scale-[0.99] no-print">
        تحقق من نص آخر
      </button>
    </div>
  )
}

export default Report
