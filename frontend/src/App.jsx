import { useState, useEffect, lazy, Suspense } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'
import OfflineBanner from './components/OfflineBanner'
import Header from './components/Header'
import SkeletonReport from './components/SkeletonReport'
import OnboardingTour from './components/OnboardingTour'
import { parseShareLink } from './utils/share'

const Home = lazy(() => import('./pages/Home'))
const Report = lazy(() => import('./pages/Report'))
const CompareView = lazy(() => import('./components/CompareView'))
const HowItWorks = lazy(() => import('./components/HowItWorks'))
const SettingsPanel = lazy(() => import('./components/SettingsPanel'))
const ApiDocs = lazy(() => import('./components/ApiDocs'))
const DiffTracker = lazy(() => import('./components/DiffTracker'))
const BatchAnalysis = lazy(() => import('./components/BatchAnalysis'))
const TeacherMode = lazy(() => import('./components/TeacherMode'))
const AdminDashboard = lazy(() => import('./components/AdminDashboard'))
const WordCounter = lazy(() => import('./components/WordCounter'))
const TextTransformer = lazy(() => import('./components/TextTransformer'))

function AppContent() {
  const [reportData, setReportData] = useState(null)
  const [view, setView] = useState('home')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const shared = parseShareLink()
    if (shared) {
      setReportData(shared)
      setView('report')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleResult = (data) => {
    setReportData(data)
    setView('report')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goHome = () => {
    setReportData(null)
    setView('home')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const switchView = (v) => {
    setReportData(null)
    setView(v)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (showSettings) { setShowSettings(false); return }
        if (view !== 'home') { goHome(); return }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [view, showSettings])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Header
        onCompareToggle={() => switchView(view === 'compare' ? 'home' : 'compare')}
        isCompareMode={view === 'compare'}
        onSettingsOpen={() => setShowSettings(true)}
        onHowItWorksOpen={() => switchView('howItWorks')}
        onApiDocsOpen={() => switchView('apiDocs')}
        onDiffOpen={() => switchView('diff')}
        onBatchOpen={() => switchView('batch')}
        onTeacherOpen={() => switchView('teacher')}
        onAdminOpen={() => switchView('admin')}
        onWordCounterOpen={() => switchView('wordCounter')}
        onTransformerOpen={() => switchView('transformer')}
        currentView={view}
      />

      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl" dir="rtl">
        <Suspense fallback={
          <div className="animate-pulse space-y-4 py-8">
            <div className="h-8 w-48 mx-auto bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-64 mx-auto bg-slate-200 dark:bg-slate-700 rounded" />
            <SkeletonReport />
          </div>
        }>
          {view === 'howItWorks' ? <HowItWorks onClose={goHome} />
          : view === 'compare' ? <CompareView onBack={goHome} />
          : view === 'apiDocs' ? <ApiDocs onClose={goHome} />
          : view === 'diff' ? <DiffTracker onClose={goHome} />
          : view === 'batch' ? <BatchAnalysis onClose={goHome} />
          : view === 'teacher' ? <TeacherMode onClose={goHome} />
          : view === 'admin' ? <AdminDashboard onClose={goHome} />
          : view === 'wordCounter' ? <WordCounter onClose={goHome} />
          : view === 'transformer' ? <TextTransformer onClose={goHome} />
          : view === 'report' && reportData ? <Report data={reportData} onBack={goHome} />
          : <Home onResult={handleResult} />}
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </Suspense>

      <OfflineBanner />
      <OnboardingTour />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
