// #24 — Enhanced skeleton matching actual report sections
function SkeletonReport() {
  return (
    <div className="space-y-6 animate-pulse" dir="rtl" aria-label="جارٍ التحميل..." role="status">
      {/* Result circle */}
      <div className="bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center">
        <div className="w-40 h-40 mx-auto mb-4 rounded-full border-[7px] border-slate-200 dark:border-slate-700" />
        <div className="h-5 w-48 mx-auto bg-slate-200 dark:bg-slate-700 rounded" />
      </div>

      {/* Confidence interval */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
        <div className="h-6 w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
            <div className="h-3 w-16 mx-auto bg-slate-200 dark:bg-slate-700 rounded mb-2" />
            <div className="h-7 w-12 mx-auto bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>

      {/* Why section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-3">
        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>

      {/* Model result */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
        <div className="flex items-center justify-between">
          <div className="h-7 w-32 bg-slate-200 dark:bg-slate-700 rounded-full" />
          <div className="w-14 h-14 rounded-full border-4 border-slate-200 dark:border-slate-700" />
        </div>
      </div>

      {/* Creativity + Style */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full border-4 border-slate-200 dark:border-slate-700 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      </div>

      {/* Indicator bars */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="h-5 w-36 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        <div className="space-y-4">
          {[85, 60, 45, 70, 30, 55].map((w, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-8 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-slate-300 dark:bg-slate-600 rounded-full" style={{ width: `${w}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paragraphs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3 space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-600 rounded" />
                <div className="h-3 w-8 bg-slate-200 dark:bg-slate-600 rounded" />
              </div>
              <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full" />
              <div className="h-3 w-4/5 bg-slate-200 dark:bg-slate-600 rounded" />
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">جارٍ تحميل نتائج التحليل...</span>
    </div>
  )
}

export default SkeletonReport
