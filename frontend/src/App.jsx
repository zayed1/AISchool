import { useState, useEffect, lazy, Suspense } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import OfflineBanner from './components/OfflineBanner'
import Header from './components/Header'
import SkeletonReport from './components/SkeletonReport'
import { parseShareLink } from './utils/share'

// #2 — Lazy-loaded pages
const Home = lazy(() => import('./pages/Home'))
const Report = lazy(() => import('./pages/Report'))
const CompareView = lazy(() => import('./components/CompareView'))

function AppContent() {
  const [reportData, setReportData] = useState(null)
  const [compareMode, setCompareMode] = useState(false)

  // #15 — Check for shared link on mount
  useEffect(() => {
    const shared = parseShareLink()
    if (shared) {
      setReportData(shared)
      // Clean URL
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
  }

  // #6 — Escape to go back
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && reportData) handleBack()
      if (e.key === 'Escape' && compareMode) {
        setCompareMode(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [reportData, compareMode])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Header onCompareToggle={handleCompareToggle} isCompareMode={compareMode} />
      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl" dir="rtl">
        {/* #2 — Suspense fallback */}
        <Suspense fallback={
          <div className="animate-pulse space-y-4 py-8">
            <div className="h-8 w-48 mx-auto bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-64 mx-auto bg-slate-200 dark:bg-slate-700 rounded" />
            <SkeletonReport />
          </div>
        }>
          {compareMode ? (
            <CompareView onBack={() => setCompareMode(false)} />
          ) : reportData ? (
            <Report data={reportData} onBack={handleBack} />
          ) : (
            <Home onResult={handleResult} />
          )}
        </Suspense>
      </main>
      <OfflineBanner />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App
