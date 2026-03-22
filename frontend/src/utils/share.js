// #15 — Share report via encoded URL
export function generateShareLink(data) {
  try {
    const minimal = {
      r: {
        p: data.result.percentage,
        l: data.result.level,
        c: data.result.color,
      },
      s: {
        t: +data.statistical.ttr.toFixed(3),
        s: +data.statistical.sentence_length_cv.toFixed(3),
        r: +data.statistical.repetitive_openers_ratio.toFixed(3),
        c: +data.statistical.connector_density.toFixed(3),
        e: +data.statistical.error_ratio.toFixed(4),
        b: +data.statistical.burstiness.toFixed(3),
        ss: +data.statistical.statistical_score.toFixed(3),
      },
      m: {
        l: data.ml.label,
        c: +data.ml.confidence.toFixed(3),
        s: +data.ml.ml_score.toFixed(3),
      },
      d: {
        w: data.metadata.word_count,
        s: data.metadata.sentence_count,
        t: data.metadata.analysis_time_ms,
      },
    }

    const encoded = btoa(encodeURIComponent(JSON.stringify(minimal)))
    return `${window.location.origin}${window.location.pathname}?share=${encoded}`
  } catch {
    return null
  }
}

export function parseShareLink() {
  try {
    const params = new URLSearchParams(window.location.search)
    const shareData = params.get('share')
    if (!shareData) return null

    const decoded = JSON.parse(decodeURIComponent(atob(shareData)))

    return {
      result: {
        percentage: decoded.r.p,
        level: decoded.r.l,
        color: decoded.r.c,
        final_score: decoded.r.p / 100,
      },
      statistical: {
        ttr: decoded.s.t,
        sentence_length_cv: decoded.s.s,
        repetitive_openers_ratio: decoded.s.r,
        connector_density: decoded.s.c,
        error_ratio: decoded.s.e,
        burstiness: decoded.s.b,
        statistical_score: decoded.s.ss,
      },
      ml: {
        label: decoded.m.l,
        confidence: decoded.m.c,
        ml_score: decoded.m.s,
      },
      sentences: [],
      metadata: {
        word_count: decoded.d.w,
        sentence_count: decoded.d.s,
        analysis_time_ms: decoded.d.t,
      },
      isShared: true,
    }
  } catch {
    return null
  }
}
