const colorMap = {
  red: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', ring: 'text-red-500' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', ring: 'text-orange-500' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', ring: 'text-yellow-500' },
  lightgreen: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', ring: 'text-emerald-500' },
  green: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', ring: 'text-green-500' },
}

function ResultCard({ result }) {
  const colors = colorMap[result.color] || colorMap.yellow
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (result.percentage / 100) * circumference

  return (
    <div className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-8 text-center`}>
      <div className="relative w-40 h-40 mx-auto mb-6">
        <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            className={colors.ring}
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-4xl font-bold ${colors.text}`}>{result.percentage}%</span>
        </div>
      </div>
      <h2 className={`text-xl font-bold ${colors.text}`}>{result.level}</h2>
    </div>
  )
}

export default ResultCard
