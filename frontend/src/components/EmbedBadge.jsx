// #12 — Embeddable HTML badge generator
import { useState } from 'react'

function EmbedBadge({ result }) {
  const [copied, setCopied] = useState(false)

  if (!result) return null

  const { percentage, color, level } = result
  const statusText = percentage >= 65 ? 'مشبوه' : percentage >= 40 ? 'غير واضح' : 'تم الفحص'
  const statusEmoji = percentage >= 65 ? '⚠️' : percentage >= 40 ? '❓' : '✅'
  const bgColor = { red: '#ef4444', orange: '#f97316', yellow: '#eab308', lightgreen: '#22c55e', green: '#16a34a' }[color] || '#94a3b8'

  const badgeHtml = `<!-- كاشف النصوص العربية المولدة بالذكاء الاصطناعي -->
<a href="${window.location.origin}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;background:${bgColor}15;border:1px solid ${bgColor}40;text-decoration:none;font-family:sans-serif;direction:rtl">
  <span style="font-size:14px">${statusEmoji}</span>
  <span style="color:${bgColor};font-size:12px;font-weight:600">${statusText}</span>
  <span style="color:#64748b;font-size:10px">| كاشف AI</span>
</a>`

  const badgeMarkdown = `[![${statusText} - كاشف AI](https://img.shields.io/badge/${encodeURIComponent(statusText)}-${encodeURIComponent('كاشف AI')}-${color === 'red' ? 'red' : color === 'orange' ? 'orange' : color === 'yellow' ? 'yellow' : 'green'})](${window.location.origin})`

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 no-print">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        شارة قابلة للتضمين
      </h3>

      {/* Preview */}
      <div className="flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-3">
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 20,
            background: `${bgColor}15`, border: `1px solid ${bgColor}40`,
            direction: 'rtl', fontFamily: 'sans-serif',
          }}
        >
          <span style={{ fontSize: 14 }}>{statusEmoji}</span>
          <span style={{ color: bgColor, fontSize: 12, fontWeight: 600 }}>{statusText}</span>
          <span style={{ color: '#64748b', fontSize: 10 }}>| كاشف AI</span>
        </div>
      </div>

      {/* HTML code */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">HTML</span>
          <button
            onClick={() => handleCopy(badgeHtml)}
            className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1"
          >
            {copied ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : null}
            {copied ? 'تم النسخ' : 'نسخ'}
          </button>
        </div>
        <pre className="text-[10px] bg-slate-900 text-green-400 p-3 rounded-lg overflow-x-auto max-h-20 leading-relaxed" dir="ltr">
          {badgeHtml}
        </pre>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-400">Markdown</span>
          <button onClick={() => handleCopy(badgeMarkdown)} className="text-xs text-primary-500 hover:text-primary-600">نسخ</button>
        </div>
        <pre className="text-[10px] bg-slate-900 text-blue-400 p-3 rounded-lg overflow-x-auto max-h-16 leading-relaxed" dir="ltr">
          {badgeMarkdown}
        </pre>
      </div>
    </div>
  )
}

export default EmbedBadge
