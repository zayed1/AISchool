// #86 — Paraphrase/copy detection — compares sentence pairs for similarity
import { useMemo, useState } from 'react'

function cleanArabic(text) {
  return text.replace(/[^\u0600-\u06FF\s]/g, '').replace(/[\u064B-\u0652]/g, '').trim()
}

function jaccardSimilarity(a, b) {
  const setA = new Set(a.split(/\s+/).filter(w => w.length > 2))
  const setB = new Set(b.split(/\s+/).filter(w => w.length > 2))
  if (setA.size === 0 || setB.size === 0) return 0
  const intersection = [...setA].filter(w => setB.has(w)).length
  const union = new Set([...setA, ...setB]).size
  return intersection / union
}

function ParaphraseDetector({ sentences }) {
  const [showAll, setShowAll] = useState(false)

  const analysis = useMemo(() => {
    if (!sentences || sentences.length < 4) return null

    const pairs = []
    const texts = sentences.map(s => s.text)

    // Compare non-adjacent sentences for paraphrase
    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 2; j < texts.length; j++) {
        const a = cleanArabic(texts[i])
        const b = cleanArabic(texts[j])
        if (a.split(/\s+/).length < 4 || b.split(/\s+/).length < 4) continue

        const sim = jaccardSimilarity(a, b)
        if (sim >= 0.4 && sim < 1.0) {
          // Find shared and different words
          const wordsA = new Set(a.split(/\s+/))
          const wordsB = new Set(b.split(/\s+/))
          const shared = [...wordsA].filter(w => wordsB.has(w))
          const onlyA = [...wordsA].filter(w => !wordsB.has(w))
          const onlyB = [...wordsB].filter(w => !wordsA.has(w))

          pairs.push({
            i, j,
            textA: texts[i],
            textB: texts[j],
            similarity: Math.round(sim * 100),
            shared: shared.length,
            changed: onlyA.length + onlyB.length,
            isParaphrase: sim >= 0.4 && sim < 0.85,
            isNearCopy: sim >= 0.85,
          })
        }
      }
    }

    if (pairs.length === 0) return null

    pairs.sort((a, b) => b.similarity - a.similarity)
    return pairs.slice(0, 10)
  }, [sentences])

  if (!analysis) return null

  const nearCopies = analysis.filter(p => p.isNearCopy)
  const paraphrases = analysis.filter(p => p.isParaphrase)

  const shown = showAll ? analysis : analysis.slice(0, 3)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-2">
        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        كشف إعادة الصياغة
      </h3>
      <p className="text-xs text-slate-400 mb-3">كشف الجمل المنسوخة أو المُعاد صياغتها داخل النص</p>

      {/* Summary */}
      <div className="flex gap-3 mb-3 text-xs">
        {nearCopies.length > 0 && (
          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full font-medium">
            {nearCopies.length} نسخ شبه مطابقة
          </span>
        )}
        {paraphrases.length > 0 && (
          <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full font-medium">
            {paraphrases.length} إعادة صياغة
          </span>
        )}
      </div>

      {/* Pairs */}
      <div className="space-y-3">
        {shown.map((pair, idx) => (
          <div key={idx} className={`rounded-lg p-3 text-xs ${pair.isNearCopy ? 'bg-red-50 dark:bg-red-900/10' : 'bg-orange-50 dark:bg-orange-900/10'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${pair.isNearCopy ? 'bg-red-200 dark:bg-red-800/40 text-red-700 dark:text-red-300' : 'bg-orange-200 dark:bg-orange-800/40 text-orange-700 dark:text-orange-300'}`}>
                  {pair.similarity}% تشابه
                </span>
                <span className="text-slate-400">جملة {pair.i + 1} ↔ جملة {pair.j + 1}</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {pair.shared} كلمة مشتركة · {pair.changed} مختلفة
              </span>
            </div>
            <div className="space-y-1.5">
              <p className="border-r-2 border-slate-300 dark:border-slate-600 pr-2 text-slate-600 dark:text-slate-400 max-h-10 overflow-hidden leading-relaxed">{pair.textA}</p>
              <p className={`border-r-2 pr-2 max-h-10 overflow-hidden leading-relaxed ${pair.isNearCopy ? 'border-red-300 text-red-700 dark:border-red-700 dark:text-red-400' : 'border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-400'}`}>{pair.textB}</p>
            </div>
          </div>
        ))}
      </div>

      {analysis.length > 3 && (
        <button onClick={() => setShowAll(!showAll)} className="text-xs text-primary-500 hover:text-primary-600 mt-2 font-medium">
          {showAll ? 'تقليص' : `عرض الكل (${analysis.length})`}
        </button>
      )}
    </div>
  )
}

export default ParaphraseDetector
