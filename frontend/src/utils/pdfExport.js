// #13 — PDF export utility (pure JS, no external libraries)
export function exportReportAsPDF(data) {
  const { result, statistical, ml, sentences, metadata } = data

  // Build a printable HTML document
  const sentenceRows = (sentences || [])
    .map((s) => {
      const scorePercent = Math.round(s.score * 100)
      const bgColor =
        s.score >= 0.65 ? '#fee2e2' : s.score >= 0.35 ? '#fef9c3' : '#dcfce7'
      return `<span style="background:${bgColor};padding:2px 4px;border-radius:3px;margin:1px">${s.text}</span>`
    })
    .join(' ')

  const indicators = [
    { label: 'تنوع المفردات', value: Math.round(statistical.ttr * 100) },
    { label: 'تباين أطوال الجمل', value: Math.round(statistical.sentence_length_cv * 100) },
    { label: 'تكرار العبارات الافتتاحية', value: Math.round(statistical.repetitive_openers_ratio * 200) },
    { label: 'كثافة أدوات الربط', value: Math.round((statistical.connector_density / 4) * 100) },
    { label: 'نسبة الأخطاء', value: Math.round((statistical.error_ratio / 0.05) * 100) },
    { label: 'الانفجارية', value: Math.round(statistical.burstiness * 100) },
  ]

  const indicatorRows = indicators
    .map(
      (ind) => `
      <div style="margin:8px 0;display:flex;justify-content:space-between;align-items:center">
        <span>${ind.label}</span>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:120px;height:10px;background:#e2e8f0;border-radius:5px;overflow:hidden">
            <div style="width:${Math.min(ind.value, 100)}%;height:100%;background:${ind.value >= 70 ? '#f87171' : ind.value >= 40 ? '#facc15' : '#4ade80'};border-radius:5px"></div>
          </div>
          <span>${Math.min(ind.value, 100)}%</span>
        </div>
      </div>`
    )
    .join('')

  const colorMap = {
    red: '#ef4444',
    orange: '#f97316',
    yellow: '#eab308',
    lightgreen: '#10b981',
    green: '#22c55e',
  }

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>تقرير كشف النص — ${result.percentage}%</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'IBM Plex Sans Arabic', sans-serif; direction: rtl; padding: 40px; color: #1e293b; max-width: 800px; margin: auto; }
    h1 { text-align: center; margin-bottom: 8px; }
    .subtitle { text-align: center; color: #64748b; margin-bottom: 32px; }
    .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
    .result-circle { text-align: center; font-size: 48px; font-weight: bold; margin: 16px 0; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
    .stat-box { text-align: center; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; }
    .stat-label { font-size: 12px; color: #64748b; }
    .stat-value { font-size: 24px; font-weight: bold; }
    .section-title { font-weight: bold; font-size: 16px; margin-bottom: 12px; }
    .sentences { line-height: 2; }
    .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>كاشف النصوص المولدة بالذكاء الاصطناعي</h1>
  <p class="subtitle">تقرير التحليل</p>

  <div class="card" style="text-align:center;border-color:${colorMap[result.color] || '#e2e8f0'}">
    <div class="result-circle" style="color:${colorMap[result.color] || '#1e293b'}">${result.percentage}%</div>
    <div style="font-weight:bold;font-size:18px;color:${colorMap[result.color] || '#1e293b'}">${result.level}</div>
  </div>

  <div class="grid">
    <div class="stat-box"><div class="stat-label">عدد الكلمات</div><div class="stat-value">${metadata.word_count}</div></div>
    <div class="stat-box"><div class="stat-label">عدد الجمل</div><div class="stat-value">${metadata.sentence_count}</div></div>
    <div class="stat-box"><div class="stat-label">زمن التحليل</div><div class="stat-value">${metadata.analysis_time_ms} مل‌ث</div></div>
  </div>

  <div class="card">
    <div class="section-title">نتيجة النموذج</div>
    <div>${ml.label.toUpperCase() === 'AI' ? 'ذكاء اصطناعي' : 'بشري'} — الثقة: ${Math.round(ml.confidence * 100)}%</div>
  </div>

  <div class="card">
    <div class="section-title">المؤشرات الإحصائية</div>
    ${indicatorRows}
  </div>

  ${sentences && sentences.length > 0 ? `
  <div class="card">
    <div class="section-title">تحليل الجمل</div>
    <div class="sentences">${sentenceRows}</div>
  </div>
  ` : ''}

  <div class="footer">
    تم إنشاء هذا التقرير بواسطة كاشف النصوص العربية المولدة بالذكاء الاصطناعي<br>
    هذه النتائج تقديرية وليست قاطعة
  </div>
</body>
</html>`

  // Open in new window for printing/saving as PDF
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 500)
  }
}
