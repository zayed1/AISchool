import { useState } from 'react'

const tooltips = {
  'تنوع المفردات': 'كلما كان تنوع المفردات منخفضاً، دل ذلك على نص مولّد آلياً يميل لتكرار نفس الكلمات.',
  'تباين أطوال الجمل': 'النصوص الآلية تميل لجمل متساوية الطول، بينما البشر يكتبون جملاً متفاوتة.',
  'تكرار العبارات الافتتاحية': 'الذكاء الاصطناعي يكرر عبارات مثل "بالإضافة إلى ذلك" و"من الجدير بالذكر" بشكل ملحوظ.',
  'كثافة أدوات الربط': 'النصوص المولدة تفرط في استخدام أدوات الربط لإعطاء انطباع بالتماسك.',
  'نسبة الأخطاء': 'النصوص الآلية خالية تقريباً من الأخطاء، بينما البشر يرتكبون أخطاء طبيعية متناثرة.',
  'الانفجارية': 'البشر يكتبون فقرات كثيفة وأخرى خفيفة، بينما الآلة تنتج كثافة متساوية.',
  'تنوع بدايات الجمل': 'كلما تنوعت بدايات الجمل، دل ذلك على أسلوب بشري أكثر طبيعية.',
  'نسبة الجمل الفرعية': 'البشر يستخدمون جملاً فرعية معقدة أكثر من النصوص المولدة.',
  'نسبة المبني للمجهول': 'الاستخدام المفرط للمبني للمجهول قد يشير إلى نص مولّد.',
}

// #7 — Direction arrows: does higher = more human or more AI?
const directions = {
  'تنوع المفردات': { higher: 'human', label: '↑ الأعلى = أكثر بشرية' },
  'تباين أطوال الجمل': { higher: 'human', label: '↑ الأعلى = أكثر بشرية' },
  'تكرار العبارات الافتتاحية': { higher: 'ai', label: '↓ الأقل = أكثر بشرية' },
  'كثافة أدوات الربط': { higher: 'ai', label: '↓ الأقل = أكثر بشرية' },
  'نسبة الأخطاء': { higher: 'human', label: '↑ الأعلى = أكثر بشرية' },
  'الانفجارية': { higher: 'human', label: '↑ الأعلى = أكثر بشرية' },
  'تنوع بدايات الجمل': { higher: 'human', label: '↑ الأعلى = أكثر بشرية' },
  'نسبة الجمل الفرعية': { higher: 'human', label: '↑ الأعلى = أكثر بشرية' },
  'نسبة المبني للمجهول': { higher: 'ai', label: '↓ الأقل = أكثر بشرية' },
}

function IndicatorBar({ label, value, maxValue = 1 }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const percentage = Math.min(Math.round((value / maxValue) * 100), 100)

  const dir = directions[label]
  // Color based on direction: if higher=human, high % is good (green); if higher=ai, high % is bad (red)
  let barColor = 'bg-yellow-400'
  if (dir?.higher === 'human') {
    barColor = percentage >= 60 ? 'bg-green-400' : percentage >= 30 ? 'bg-yellow-400' : 'bg-red-400'
  } else {
    barColor = percentage >= 60 ? 'bg-red-400' : percentage >= 30 ? 'bg-yellow-400' : 'bg-green-400'
  }

  return (
    <div className="space-y-1.5 relative" role="meter" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="flex justify-between items-center text-sm">
        <span
          className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-help"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onTouchStart={() => setShowTooltip(!showTooltip)}
        >
          {label}
          <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <div className="flex items-center gap-2">
          {/* #7 — Direction arrow */}
          {dir && (
            <span className={`text-[9px] ${dir.higher === 'human' ? 'text-green-500' : 'text-red-500'}`}>
              {dir.higher === 'human' ? '↑' : '↓'}
            </span>
          )}
          <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">{percentage}%</span>
        </div>
      </div>

      {showTooltip && tooltips[label] && (
        <div className="absolute z-20 top-full right-0 mt-1 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-lg p-3 max-w-xs shadow-lg leading-relaxed" role="tooltip">
          <p>{tooltips[label]}</p>
          {dir && <p className="mt-1.5 text-slate-300 font-medium">{dir.label}</p>}
          <div className="absolute -top-1 right-4 w-2 h-2 bg-slate-800 dark:bg-slate-700 transform rotate-45" />
        </div>
      )}

      <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default IndicatorBar
