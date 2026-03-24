// #52 — Smart skeleton matching real report layout with shimmer effect
function SkeletonReport() {
  return (
    <div className="space-y-6 animate-pulse" dir="rtl" aria-label="جارٍ التحميل..." role="status">
      {/* Result circle — matches ResultCard */}
      <div className="bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center relative overflow-hidden">
        <div className="w-44 h-44 mx-auto mb-6 rounded-full border-[7px] border-slate-200 dark:border-slate-700 relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="h-10 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-1" />
            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
        <div className="h-6 w-36 mx-auto bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="absolute inset-0 shimmer-overlay" />
      </div>

      {/* Text heatmap placeholder */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 relative overflow-hidden">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {[60, 45, 80, 35, 55, 70, 40, 50].map((w, i) => (
              <div key={i} className="h-5 bg-slate-100 dark:bg-slate-700 rounded" style={{ width: `${w}px` }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {[50, 65, 40, 75, 45, 55].map((w, i) => (
              <div key={i} className="h-5 bg-slate-100 dark:bg-slate-700 rounded" style={{ width: `${w}px` }} />
            ))}
          </div>
        </div>
        <div className="absolute inset-0 shimmer-overlay" />
      </div>

      {/* Confidence interval */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 relative overflow-hidden">
        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
        <div className="h-6 w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="absolute inset-0 shimmer-overlay" />
      </div>

      {/* Stats cards — matches 3-column grid */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center relative overflow-hidden">
            <div className="h-3 w-16 mx-auto bg-slate-200 dark:bg-slate-700 rounded mb-2" />
            <div className="h-7 w-12 mx-auto bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="absolute inset-0 shimmer-overlay" />
          </div>
        ))}
      </div>

      {/* Why section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-3 relative overflow-hidden">
        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-5/6 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="absolute inset-0 shimmer-overlay" />
      </div>

      {/* Model result — matches the actual layout */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 relative overflow-hidden">
        <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
        <div className="flex items-center justify-between">
          <div className="h-7 w-32 bg-slate-200 dark:bg-slate-700 rounded-full" />
          <div className="w-[80px] h-[80px] rounded-full border-[5px] border-slate-200 dark:border-slate-700 relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="h-5 w-10 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-2 w-6 bg-slate-200 dark:bg-slate-700 rounded mt-1" />
            </div>
          </div>
        </div>
        <div className="absolute inset-0 shimmer-overlay" />
      </div>

      {/* Radar chart placeholder */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 relative overflow-hidden">
        <div className="w-48 h-48 mx-auto rounded-full border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-700" />
        </div>
        <div className="absolute inset-0 shimmer-overlay" />
      </div>

      {/* Indicator bars */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 relative overflow-hidden">
        <div className="h-5 w-36 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        <div className="space-y-4">
          {[85, 60, 45, 70, 30, 55, 65, 40, 50].map((w, i) => (
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
        <div className="absolute inset-0 shimmer-overlay" />
      </div>

      {/* Paragraphs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 relative overflow-hidden">
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
        <div className="absolute inset-0 shimmer-overlay" />
      </div>

      <span className="sr-only">جارٍ تحميل نتائج التحليل...</span>
    </div>
  )
}

export default SkeletonReport
