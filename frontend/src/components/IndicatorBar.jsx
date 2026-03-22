import { useState } from 'react'

const tooltips = {
  'تنوع المفردات': 'كلما كان تنوع المفردات منخفضاً، دل ذلك على نص مولّد آلياً يميل لتكرار نفس الكلمات.',
  'تباين أطوال الجمل': 'النصوص الآلية تميل لجمل متساوية الطول، بينما البشر يكتبون جملاً متفاوتة.',
  'تكرار العبارات الافتتاحية': 'الذكاء الاصطناعي يكرر عبارات مثل "بالإضافة إلى ذلك" و"من الجدير بالذكر" بشكل ملحوظ.',
  'كثافة أدوات الربط': 'النصوص المولدة تفرط في استخدام أدوات الربط لإعطاء انطباع بالتماسك.',
  'نسبة الأخطاء': 'النصوص الآلية خالية تقريباً من الأخطاء، بينما البشر يرتكبون أخطاء طبيعية متناثرة.',
  'الانفجارية': 'البشر يكتبون فقرات كثيفة وأخرى خفيفة، بينما الآلة تنتج كثافة متساوية.',
}

function IndicatorBar({ label, value, maxValue = 1 }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const percentage = Math.min(Math.round((value / maxValue) * 100), 100)

  let barColor = 'bg-green-400'
  if (percentage >= 70) barColor = 'bg-red-400'
  else if (percentage >= 40) barColor = 'bg-yellow-400'

  return (
    <div className="space-y-1.5 relative">
      <div className="flex justify-between items-center text-sm">
        <span
          className="font-medium text-slate-700 flex items-center gap-1.5 cursor-help"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onTouchStart={() => setShowTooltip(!showTooltip)}
        >
          {label}
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <span className="text-slate-500 font-mono text-xs">{percentage}%</span>
      </div>

      {/* #2 — Tooltip */}
      {showTooltip && tooltips[label] && (
        <div className="absolute z-20 top-full right-0 mt-1 bg-slate-800 text-white text-xs rounded-lg p-3 max-w-xs shadow-lg leading-relaxed">
          {tooltips[label]}
          <div className="absolute -top-1 right-4 w-2 h-2 bg-slate-800 transform rotate-45" />
        </div>
      )}

      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default IndicatorBar
