import { useState } from 'react'
import Header from './components/Header'
import Home from './pages/Home'
import Report from './pages/Report'

function App() {
  const [reportData, setReportData] = useState(null)

  const handleResult = (data) => {
    setReportData(data)
  }

  const handleBack = () => {
    setReportData(null)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {reportData ? (
          <Report data={reportData} onBack={handleBack} />
        ) : (
          <Home onResult={handleResult} />
        )}
      </main>
    </div>
  )
}

export default App
