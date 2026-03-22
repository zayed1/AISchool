function SentenceHighlight({ sentences }) {
  // #4 — Gradient coloring based on exact score
  const getGradientStyle = (score) => {
    // score 0..1: 0=human(green), 1=AI(red)
    let r, g, b, bgR, bgG, bgB, borderR, borderG, borderB

    if (score <= 0.35) {
      // green zone
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
      // yellow zone
      const t = (score - 0.35) / 0.3
      r = Math.round(161 + t * 40)
      g = Math.round(98 + t * 20)
      b = Math.round(7)
      bgR = Math.round(254)
      bgG = Math.round(252 - t * 20)
      bgB = Math.round(232 - t * 20)
      borderR = Math.round(252)
      borderG = Math.round(211 - t * 30)
      borderB = Math.round(77 - t * 20)
    } else {
      // red zone
      const t = (score - 0.65) / 0.35
      r = Math.round(185 + t * 40)
      g = Math.round(28 - t * 10)
      b = Math.round(28)
      bgR = Math.round(254)
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
    <div className="bg-white rounded-xl border border-slate-200 p-6" id="section-sentences">
      <h3 className="text-lg font-bold text-slate-800 mb-4">تحليل الجمل</h3>
      <div className="leading-loose text-base space-y-1">
        {sentences.map((sentence, index) => (
          <span
            key={index}
            className="inline rounded px-1 py-0.5 mx-0.5 border-b-2 cursor-default"
            style={getGradientStyle(sentence.score)}
            title={`نسبة الشبهة: ${Math.round(sentence.score * 100)}%`}
          >
            {sentence.text}
          </span>
        ))}
      </div>
      {/* Gradient legend */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>طبيعي</span>
          <div className="flex-1 h-3 rounded-full" style={{
            background: 'linear-gradient(to left, rgb(220,252,231), rgb(254,252,232), rgb(254,226,226))'
          }} />
          <span>مشبوه</span>
        </div>
      </div>
    </div>
  )
}

export default SentenceHighlight
