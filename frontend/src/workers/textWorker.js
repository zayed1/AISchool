// #4 — Web Worker for text processing
self.onmessage = function (e) {
  const { type, text } = e.data

  if (type === 'wordCount') {
    const trimmed = text.trim()
    const count = trimmed ? trimmed.split(/\s+/).length : 0
    self.postMessage({ type: 'wordCount', count })
  }

  if (type === 'charStats') {
    const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length
    const totalAlpha = (text.match(/[a-zA-Z\u0600-\u06FF]/g) || []).length
    const arabicRatio = totalAlpha > 0 ? arabicChars / totalAlpha : 1
    self.postMessage({ type: 'charStats', arabicChars, totalAlpha, arabicRatio })
  }
}
