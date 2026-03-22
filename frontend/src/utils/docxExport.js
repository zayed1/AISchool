// DOCX export utility
export function exportReportAsDOCX(data) {
  const { result, statistical, ml, metadata } = data

  // Build HTML content that Word can render
  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><style>
  body { font-family: 'Traditional Arabic', 'Arial', sans-serif; direction: rtl; padding: 20px; }
  h1 { color: #1e293b; font-size: 20pt; text-align: center; border-bottom: 3px solid ${getColor(result.color)}; padding-bottom: 10px; }
  h2 { color: #334155; font-size: 14pt; margin-top: 20px; }
  .result-box { text-align: center; padding: 20px; margin: 15px 0; border: 2px solid ${getColor(result.color)}; border-radius: 8px; }
  .result-pct { font-size: 36pt; font-weight: bold; color: ${getColor(result.color)}; }
  .result-level { font-size: 12pt; color: #475569; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: right; }
  th { background: #f1f5f9; font-weight: bold; }
  .bar { height: 12px; border-radius: 6px; display: inline-block; }
  .meta { color: #64748b; font-size: 10pt; }
  .disclaimer { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; margin-top: 20px; font-size: 9pt; color: #94a3b8; }
</style></head>
<body>
  <h1>تقرير كشف النصوص المولدة بالذكاء الاصطناعي</h1>

  <div class="result-box">
    <div class="result-pct">${result.percentage}%</div>
    <div class="result-level">${result.level}</div>
  </div>

  <h2>نتيجة النموذج</h2>
  <table>
    <tr><th>التصنيف</th><td>${ml.label.toUpperCase() === 'AI' ? 'ذكاء اصطناعي' : 'بشري'}</td></tr>
    <tr><th>الثقة</th><td>${Math.round(ml.confidence * 100)}%</td></tr>
  </table>

  <h2>المؤشرات الإحصائية</h2>
  <table>
    <tr><th>المؤشر</th><th>القيمة</th><th>النسبة</th></tr>
    <tr><td>تنوع المفردات</td><td>${statistical.ttr}</td><td>${Math.round(statistical.ttr * 100)}%</td></tr>
    <tr><td>تباين أطوال الجمل</td><td>${statistical.sentence_length_cv}</td><td>${Math.round(statistical.sentence_length_cv * 100)}%</td></tr>
    <tr><td>تكرار الافتتاحيات</td><td>${statistical.repetitive_openers_ratio}</td><td>${Math.round(statistical.repetitive_openers_ratio * 200)}%</td></tr>
    <tr><td>كثافة أدوات الربط</td><td>${statistical.connector_density}</td><td>${Math.round((statistical.connector_density / 4) * 100)}%</td></tr>
    <tr><td>نسبة الأخطاء</td><td>${statistical.error_ratio}</td><td>${Math.round((statistical.error_ratio / 0.05) * 100)}%</td></tr>
    <tr><td>الانفجارية</td><td>${statistical.burstiness}</td><td>${Math.round(statistical.burstiness * 100)}%</td></tr>
  </table>

  <h2>معلومات النص</h2>
  <table>
    <tr><th>عدد الكلمات</th><td>${metadata.word_count}</td></tr>
    <tr><th>عدد الجمل</th><td>${metadata.sentence_count}</td></tr>
    <tr><th>زمن التحليل</th><td>${metadata.analysis_time_ms} مللي ثانية</td></tr>
  </table>

  <h2>النتائج التفصيلية</h2>
  <table>
    <tr><th>التحليل الإحصائي</th><td>${Math.round(statistical.statistical_score * 100)}%</td></tr>
    <tr><th>نموذج ML</th><td>${Math.round(ml.ml_score * 100)}%</td></tr>
    <tr><th>النتيجة النهائية</th><td><b>${result.percentage}%</b></td></tr>
  </table>

  <div class="disclaimer">
    <b>ملاحظة:</b> هذه الأداة تقدم تقديراً احتمالياً وليست قاطعة. لا ينبغي الاعتماد عليها كدليل وحيد.
    <br>تاريخ التحليل: ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
  </div>
</body></html>`

  const blob = new Blob(['\ufeff' + html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ai-detection-report-${result.percentage}pct.doc`
  a.click()
  URL.revokeObjectURL(url)
}

function getColor(color) {
  const map = { red: '#ef4444', orange: '#f97316', yellow: '#eab308', lightgreen: '#10b981', green: '#22c55e' }
  return map[color] || '#3b82f6'
}
