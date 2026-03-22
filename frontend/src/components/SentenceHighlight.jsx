function SentenceHighlight({ sentences }) {
  const getHighlightClass = (flag) => {
    switch (flag) {
      case 'high':
        return 'bg-red-100 text-red-900 border-b-2 border-red-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-900 border-b-2 border-yellow-300'
      case 'low':
        return 'bg-green-100 text-green-900 border-b-2 border-green-300'
      default:
        return 'text-slate-700'
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4">تحليل الجمل</h3>
      <div className="leading-loose text-base space-y-1">
        {sentences.map((sentence, index) => (
          <span
            key={index}
            className={`inline rounded px-1 py-0.5 mx-0.5 ${getHighlightClass(sentence.flag)}`}
            title={`نسبة الشبهة: ${Math.round(sentence.score * 100)}%`}
          >
            {sentence.text}
          </span>
        ))}
      </div>
      <div className="flex gap-6 mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-4 h-3 bg-red-100 border border-red-300 rounded" />
          <span>مشبوهة جداً</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-3 bg-yellow-100 border border-yellow-300 rounded" />
          <span>مشبوهة قليلاً</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-3 bg-green-100 border border-green-300 rounded" />
          <span>طبيعية</span>
        </div>
      </div>
    </div>
  )
}

export default SentenceHighlight
