function SentenceHighlight({ sentences }) {
  const getGradientStyle = (score) => {
    let r, g, b, bgR, bgG, bgB, borderR, borderG, borderB

    if (score <= 0.35) {
      const t = score / 0.35
      r = Math.round(22 + t * 100)
      g = Math.round(163 - t * 30)
      b = Math.round(74 - t * 20)
      bgR = Math.round(220 + t * 35)
      bgG = Math.round(252 - t * 20)
      bgB = Math.round(231 - t * 20)
      borderR = Math.round(134 + t * 60)
      borderG = Math.round(239 - t * 30)
      borderB = Math.round(172 - t * 40)
    } else if (score <= 0.65) {
      const t = (score - 0.35) / 0.3
      r = Math.round(161 + t * 40)
      g = Math.round(98 + t * 20)
      b = 7
      bgR = 254
      bgG = Math.round(252 - t * 20)
      bgB = Math.round(232 - t * 20)
      borderR = 252
      borderG = Math.round(211 - t * 30)
      borderB = Math.round(77 - t * 20)
    } else {
      const t = (score - 0.65) / 0.35
      r = Math.round(185 + t * 40)
      g = Math.round(28 - t * 10)
      b = 28
      bgR = 254
      bgG = Math.round(226 - t * 20)
      bgB = Math.round(226 - t * 10)
      borderR = Math.round(252 - t * 10)
      borderG = Math.round(165 - t * 50)
      borderB = Math.round(165 - t * 50)
    }

    return {
      color: `rgb(${r},${g},${b})`,
      backgroundColor: `rgb(${bgR},${bgG},${bgB})`,
      borderBottomColor: `rgb(${borderR},${borderG},${borderB})`,
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6" id="section-sentences">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">تحليل الجمل</h3>
      <div className="leading-loose text-base space-y-1" dir="rtl">
        {sentences.map((sentence, index) => (
          <span
            key={index}
            className="inline rounded px-1 py-0.5 mx-0.5 border-b-2 cursor-default"
            style={getGradientStyle(sentence.score)}
            title={`نسبة الشبهة: ${Math.round(sentence.score * 100)}%`}
            role="text"
            aria-label={`جملة: ${sentence.text} — نسبة الشبهة ${Math.round(sentence.score * 100)}%`}
          >
            {sentence.text}
          </span>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <span>طبيعي</span>
          <div className="flex-1 h-3 rounded-full" style={{
            background: 'linear-gradient(to left, rgb(220,252,231), rgb(254,252,232), rgb(254,226,226))'
          }} aria-hidden="true" />
          <span>مشبوه</span>
        </div>
      </div>
    </div>
  )
}

export default SentenceHighlight
