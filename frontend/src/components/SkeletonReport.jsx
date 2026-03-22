function SkeletonReport() {
  return (
    <div className="space-y-6 animate-pulse" dir="rtl">
      {/* Result card skeleton */}
      <div className="bg-slate-100 border-2 border-slate-200 rounded-2xl p-8 text-center">
        <div className="w-40 h-40 mx-auto mb-6 rounded-full bg-slate-200" />
        <div className="h-6 w-64 mx-auto bg-slate-200 rounded" />
      </div>

      {/* Metadata grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="h-4 w-20 mx-auto bg-slate-200 rounded mb-2" />
            <div className="h-8 w-16 mx-auto bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* ML result skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="h-5 w-32 bg-slate-200 rounded mb-3" />
        <div className="flex items-center gap-4">
          <div className="h-7 w-24 bg-slate-200 rounded-full" />
          <div className="h-4 w-20 bg-slate-200 rounded" />
        </div>
      </div>

      {/* Indicators skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
        <div className="space-y-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-28 bg-slate-200 rounded" />
                <div className="h-4 w-10 bg-slate-200 rounded" />
              </div>
              <div className="h-3 w-full bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Sentences skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="h-5 w-28 bg-slate-200 rounded mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 bg-slate-200 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default SkeletonReport
