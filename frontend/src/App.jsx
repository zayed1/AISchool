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

function AppContent() {
  const [reportData, setReportData] = useState(null)
  const [compareMode, setCompareMode] = useState(false)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Check for shared link on mount
  useEffect(() => {
    const shared = parseShareLink()
    if (shared) {
      setReportData(shared)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleResult = (data) => {
    setReportData(data)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    setReportData(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCompareToggle = () => {
    setCompareMode(!compareMode)
    setReportData(null)
    setShowHowItWorks(false)
  }

  // Escape to go back
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (showSettings) { setShowSettings(false); return }
        if (showHowItWorks) { setShowHowItWorks(false); return }
        if (reportData) { handleBack(); return }
        if (compareMode) { setCompareMode(false); return }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [reportData, compareMode, showHowItWorks, showSettings])

  // Determine current view
  let currentView = 'home'
  if (compareMode) currentView = 'compare'
  else if (showHowItWorks) currentView = 'howItWorks'
  else if (reportData) currentView = 'report'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Header
        onCompareToggle={handleCompareToggle}
        isCompareMode={compareMode}
        onSettingsOpen={() => setShowSettings(true)}
        onHowItWorksOpen={() => { setShowHowItWorks(true); setCompareMode(false); setReportData(null) }}
      />

      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl" dir="rtl">
        <Suspense fallback={
          <div className="animate-pulse space-y-4 py-8">
            <div className="h-8 w-48 mx-auto bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-64 mx-auto bg-slate-200 dark:bg-slate-700 rounded" />
            <SkeletonReport />
          </div>
        }>
          {currentView === 'howItWorks' ? (
            <HowItWorks onClose={() => setShowHowItWorks(false)} />
          ) : currentView === 'compare' ? (
            <CompareView onBack={() => setCompareMode(false)} />
          ) : currentView === 'report' ? (
            <Report data={reportData} onBack={handleBack} />
          ) : (
            <Home onResult={handleResult} />
          )}
        </Suspense>
      </main>

      {/* Settings panel */}
      <Suspense fallback={null}>
        <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </Suspense>

      <OfflineBanner />

      {/* #17 — Onboarding tour */}
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
