// API Documentation page
function ApiDocs({ onClose }) {
  const apiBase = window.location.origin

  const copyCode = (text) => {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  const endpoints = [
    {
      method: 'POST',
      path: '/api/analyze',
      description: 'تحليل نص عربي وكشف احتمالية توليده بالذكاء الاصطناعي',
      request: `{
  "text": "النص العربي المراد تحليله...",
  "detailed": true
}`,
      response: `{
  "result": {
    "final_score": 0.72,
    "percentage": 72,
    "level": "مؤشرات قوية على استخدام AI",
    "color": "orange"
  },
  "statistical": {
    "ttr": 0.45, "sentence_length_cv": 0.25,
    "repetitive_openers_ratio": 0.15,
    "connector_density": 2.1, "error_ratio": 0.001,
    "burstiness": 0.18, "statistical_score": 0.65
  },
  "ml": {
    "label": "AI", "confidence": 0.89,
    "ml_score": 0.89
  },
  "sentences": [
    { "text": "...", "score": 0.85, "flag": "high" }
  ],
  "metadata": {
    "word_count": 150, "sentence_count": 12,
    "analysis_time_ms": 340
  }
}`,
      curl: `curl -X POST ${apiBase}/api/analyze \\
  -H "Content-Type: application/json" \\
  -d '{"text": "النص هنا...", "detailed": true}'`,
      python: `import requests

response = requests.post("${apiBase}/api/analyze", json={
    "text": "النص العربي المراد تحليله...",
    "detailed": True
})
data = response.json()
print(f"النتيجة: {data['result']['percentage']}%")`,
      javascript: `const response = await fetch("${apiBase}/api/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "النص هنا...", detailed: true })
});
const data = await response.json();
console.log(\`النتيجة: \${data.result.percentage}%\`);`,
    },
    {
      method: 'GET',
      path: '/api/health',
      description: 'التحقق من حالة الخادم والنموذج',
      request: null,
      response: `{
  "status": "healthy",
  "model_loaded": true
}`,
      curl: `curl ${apiBase}/api/health`,
      python: null,
      javascript: null,
    },
    {
      method: 'POST',
      path: '/api/fetch-url',
      description: 'استخراج النص من رابط صفحة ويب',
      request: `{ "url": "https://example.com/article" }`,
      response: `{ "text": "النص المستخرج..." }`,
      curl: `curl -X POST ${apiBase}/api/fetch-url \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com/article"}'`,
      python: null,
      javascript: null,
    },
  ]

  const CodeBlock = ({ code, lang }) => (
    <div className="relative group">
      <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 text-xs overflow-x-auto leading-relaxed" dir="ltr">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => copyCode(code)}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[10px] text-slate-300"
      >
        نسخ
      </button>
    </div>
  )

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">توثيق API</h2>
        <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="bg-primary-50 dark:bg-primary-900/10 rounded-xl p-4 border border-primary-200 dark:border-primary-800">
        <p className="text-sm text-primary-700 dark:text-primary-400">
          <span className="font-bold">الرابط الأساسي:</span>
          <code className="mx-2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 rounded text-xs" dir="ltr">{apiBase}/api</code>
        </p>
        <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">جميع الطلبات تستخدم JSON. الحد: 50-5000 كلمة عربية.</p>
      </div>

      {endpoints.map((ep, idx) => (
        <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${ep.method === 'GET' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
              {ep.method}
            </span>
            <code className="text-sm font-mono text-slate-700 dark:text-slate-300" dir="ltr">{ep.path}</code>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400">{ep.description}</p>

          {ep.request && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">الطلب:</p>
              <CodeBlock code={ep.request} lang="json" />
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">الاستجابة:</p>
            <CodeBlock code={ep.response} lang="json" />
          </div>

          {/* Examples in tabs */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">أمثلة:</p>
            <div className="space-y-2">
              <div><p className="text-[10px] text-slate-400 mb-1">cURL</p><CodeBlock code={ep.curl} lang="bash" /></div>
              {ep.python && <div><p className="text-[10px] text-slate-400 mb-1">Python</p><CodeBlock code={ep.python} lang="python" /></div>}
              {ep.javascript && <div><p className="text-[10px] text-slate-400 mb-1">JavaScript</p><CodeBlock code={ep.javascript} lang="javascript" /></div>}
            </div>
          </div>
        </div>
      ))}

      {/* Limits */}
      <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
        <h3 className="font-bold text-amber-700 dark:text-amber-400 text-sm mb-2">القيود</h3>
        <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-1">
          <li>• النص: 50-5000 كلمة</li>
          <li>• اللغة: عربية بنسبة 30% على الأقل</li>
          <li>• الحد: 20 طلب/ساعة (من جهة العميل)</li>
          <li>• حجم الطلب: 1MB كحد أقصى</li>
        </ul>
      </div>

      <button onClick={onClose} className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors">
        رجوع
      </button>
    </div>
  )
}

export default ApiDocs
