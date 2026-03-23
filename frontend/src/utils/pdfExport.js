// #33 — Enhanced PDF export with proper Arabic formatting, logo, and styled layout
export function exportReportAsPDF(data) {
  const { result, statistical, ml, sentences, metadata } = data

  const sentenceRows = (sentences || [])
    .map((s) => {
      const scorePercent = Math.round(s.score * 100)
      const bgColor =
        s.score >= 0.65 ? '#fee2e2' : s.score >= 0.35 ? '#fef9c3' : '#dcfce7'
      return `<span style="background:${bgColor};padding:2px 6px;border-radius:4px;margin:2px;display:inline">${s.text}</span>`
    })
    .join(' ')

  const indicators = [
    { label: 'تنوع المفردات', value: Math.round(statistical.ttr * 100), key: 'ttr' },
    { label: 'تباين أطوال الجمل', value: Math.round(statistical.sentence_length_cv * 100), key: 'cv' },
    { label: 'تكرار العبارات الافتتاحية', value: Math.round(statistical.repetitive_openers_ratio * 200), key: 'openers' },
    { label: 'كثافة أدوات الربط', value: Math.round((statistical.connector_density / 4) * 100), key: 'connectors' },
    { label: 'نسبة الأخطاء', value: Math.round((statistical.error_ratio / 0.05) * 100), key: 'errors' },
    { label: 'الانفجارية', value: Math.round(statistical.burstiness * 100), key: 'burstiness' },
    { label: 'تنوع بدايات الجمل', value: Math.round((statistical.opener_diversity || 0) * 100), key: 'opener_div' },
    { label: 'نسبة الجمل الفرعية', value: Math.round((statistical.subordinate_ratio || 0) * 200), key: 'subordinate' },
    { label: 'نسبة المبني للمجهول', value: Math.round((statistical.passive_ratio || 0) * 1000), key: 'passive' },
  ]

  const colorMap = {
    red: { accent: '#ef4444', bg: '#fef2f2', label: 'مولّد بالذكاء الاصطناعي' },
    orange: { accent: '#f97316', bg: '#fff7ed', label: 'مشبوه' },
    yellow: { accent: '#eab308', bg: '#fefce8', label: 'غير واضح' },
    lightgreen: { accent: '#10b981', bg: '#ecfdf5', label: 'غالباً بشري' },
    green: { accent: '#22c55e', bg: '#f0fdf4', label: 'بشري' },
  }

  const c = colorMap[result.color] || colorMap.yellow
  const now = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const indicatorRows = indicators
    .map(
      (ind) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f1f5f9">
        <span style="font-size:13px;color:#475569">${ind.label}</span>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:140px;height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden">
            <div style="width:${Math.min(ind.value, 100)}%;height:100%;background:${ind.value >= 70 ? '#f87171' : ind.value >= 40 ? '#facc15' : '#4ade80'};border-radius:4px;transition:width 0.3s"></div>
          </div>
          <span style="font-size:12px;font-weight:600;color:#334155;min-width:35px;text-align:left">${Math.min(ind.value, 100)}%</span>
        </div>
      </div>`
    )
    .join('')

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>تقرير كشف النص — ${result.percentage}%</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'IBM Plex Sans Arabic', sans-serif; direction: rtl; padding: 0; color: #1e293b; background: #f8fafc; }
    .page { max-width: 780px; margin: 0 auto; padding: 40px; }

    /* Header band */
    .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 28px 32px; border-radius: 16px 16px 0 0; display: flex; align-items: center; justify-content: space-between; }
    .header .logo { display: flex; align-items: center; gap: 12px; }
    .header .logo-icon { width: 40px; height: 40px; background: ${c.accent}; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .header h1 { font-size: 18px; font-weight: 700; }
    .header .sub { font-size: 12px; opacity: 0.7; }
    .header .date { font-size: 11px; opacity: 0.6; }

    /* Body */
    .body { background: white; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px; padding: 32px; }

    /* Result hero */
    .result-hero { background: ${c.bg}; border: 2px solid ${c.accent}30; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px; }
    .result-circle { width: 120px; height: 120px; border-radius: 50%; border: 6px solid ${c.accent}; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto 16px; background: white; }
    .result-pct { font-size: 36px; font-weight: 800; color: ${c.accent}; line-height: 1; }
    .result-pct-label { font-size: 10px; color: #94a3b8; margin-top: 2px; }
    .result-level { font-size: 18px; font-weight: 700; color: ${c.accent}; }
    .result-badge { display: inline-block; background: ${c.accent}; color: white; font-size: 11px; font-weight: 600; padding: 4px 14px; border-radius: 20px; margin-top: 8px; }

    /* Stats grid */
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .stat-box { text-align: center; padding: 16px 8px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; }
    .stat-label { font-size: 11px; color: #94a3b8; margin-bottom: 4px; }
    .stat-value { font-size: 22px; font-weight: 700; color: #1e293b; }

    /* Sections */
    .section { margin-bottom: 24px; }
    .section-title { font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 2px solid ${c.accent}30; display: flex; align-items: center; gap: 8px; }
    .section-title::before { content: ''; width: 4px; height: 18px; background: ${c.accent}; border-radius: 2px; }

    /* Sentences */
    .sentences { line-height: 2.2; font-size: 13px; }

    /* Footer */
    .footer { margin-top: 32px; padding-top: 20px; border-top: 2px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .footer-text { font-size: 11px; color: #94a3b8; }
    .footer-disclaimer { font-size: 10px; color: #cbd5e1; max-width: 400px; line-height: 1.5; }

    @media print {
      body { background: white; padding: 0; }
      .page { padding: 0; }
      .header { border-radius: 0; }
      .body { border: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div>
          <h1>كاشف النصوص المولدة بالذكاء الاصطناعي</h1>
          <div class="sub">تقرير التحليل التفصيلي</div>
        </div>
      </div>
      <div class="date">${now}</div>
    </div>

    <div class="body">
      <div class="result-hero">
        <div class="result-circle">
          <div class="result-pct">${result.percentage}%</div>
          <div class="result-pct-label">احتمال AI</div>
        </div>
        <div class="result-level">${result.level}</div>
        <div class="result-badge">${c.label}</div>
      </div>

      <div class="stats">
        <div class="stat-box">
          <div class="stat-label">عدد الكلمات</div>
          <div class="stat-value">${metadata.word_count}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">عدد الجمل</div>
          <div class="stat-value">${metadata.sentence_count}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">النموذج</div>
          <div class="stat-value" style="font-size:16px">${ml.label.toUpperCase() === 'AI' ? 'ذكاء اصطناعي' : 'بشري'}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">ثقة النموذج</div>
          <div class="stat-value">${Math.round(ml.confidence * 100)}%</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">المؤشرات الإحصائية</div>
        ${indicatorRows}
      </div>

      ${sentences && sentences.length > 0 ? `
      <div class="section">
        <div class="section-title">تحليل الجمل</div>
        <div class="sentences">${sentenceRows}</div>
      </div>
      ` : ''}

      <div class="footer">
        <div class="footer-text">
          كاشف النصوص العربية المولدة بالذكاء الاصطناعي<br>
          زمن التحليل: ${metadata.analysis_time_ms} مل‌ث
        </div>
        <div class="footer-disclaimer">
          هذه النتائج تقديرية وليست قاطعة. لا ينبغي الاعتماد عليها كدليل وحيد في اتخاذ قرارات أكاديمية أو مهنية.
        </div>
      </div>
    </div>
  </div>
</body>
</html>`

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 500)
  }
}
