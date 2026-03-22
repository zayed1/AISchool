import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false, reported: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    // Save error to localStorage for admin dashboard
    try {
      const errors = JSON.parse(localStorage.getItem('error_log') || '[]')
      errors.unshift({
        message: error.message,
        stack: error.stack?.slice(0, 500),
        time: new Date().toISOString(),
        url: window.location.href,
      })
      if (errors.length > 10) errors.length = 10
      localStorage.setItem('error_log', JSON.stringify(errors))
    } catch {}
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false, reported: false })
  }

  handleReport = () => {
    const { error, errorInfo } = this.state
    const report = `خطأ: ${error?.message}\n\nStack:\n${error?.stack?.slice(0, 800)}\n\nComponent:\n${errorInfo?.componentStack?.slice(0, 400)}`
    navigator.clipboard.writeText(report).catch(() => {})
    this.setState({ reported: true })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center" dir="rtl">
          <div className="text-center space-y-4 max-w-md mx-auto p-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">حدث خطأ غير متوقع</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى أو إرسال تقرير بالمشكلة.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
              >
                إعادة المحاولة
              </button>
              <button
                onClick={this.handleReport}
                className={`px-4 py-3 border rounded-xl font-medium text-sm transition-colors ${this.state.reported ? 'bg-green-50 border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                {this.state.reported ? 'تم النسخ!' : 'نسخ تقرير الخطأ'}
              </button>
            </div>

            {/* Error details toggle */}
            <button
              onClick={() => this.setState({ showDetails: !this.state.showDetails })}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {this.state.showDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
            </button>

            {this.state.showDetails && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-xs text-slate-500 dark:text-slate-400 text-left overflow-auto max-h-40" dir="ltr">
                <p className="font-bold text-red-500 mb-1">{this.state.error?.message}</p>
                <pre className="whitespace-pre-wrap text-[10px] opacity-70">{this.state.error?.stack?.slice(0, 500)}</pre>
              </div>
            )}

            {/* Recent errors */}
            {(() => {
              try {
                const errors = JSON.parse(localStorage.getItem('error_log') || '[]')
                if (errors.length > 1) {
                  return (
                    <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-2">
                      آخر {Math.min(errors.length, 3)} أخطاء مسجلة
                    </p>
                  )
                }
              } catch {}
              return null
            })()}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
