import ResultCard from '../components/ResultCard'
import IndicatorBar from '../components/IndicatorBar'
import SentenceHighlight from '../components/SentenceHighlight'

const indicatorLabels = {
  ttr: 'تنوع المفردات',
  sentence_length_cv: 'تباين أطوال الجمل',
  repetitive_openers_ratio: 'تكرار العبارات الافتتاحية',
  connector_density: 'كثافة أدوات الربط',
  error_ratio: 'نسبة الأخطاء',
  burstiness: 'الانفجارية',
}

const indicatorMaxValues = {
  ttr: 1,
  sentence_length_cv: 1,
  repetitive_openers_ratio: 0.5,
  connector_density: 4,
  error_ratio: 0.05,
  burstiness: 1,
}

function Report({ data, onBack }) {
  const { result, statistical, ml, sentences, metadata } = data

  return (
    <div className="space-y-6">
      <ResultCard result={result} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">عدد الكلمات</p>
          <p className="text-2xl font-bold text-slate-800">{metadata.word_count}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">عدد الجمل</p>
          <p className="text-2xl font-bold text-slate-800">{metadata.sentence_count}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">زمن التحليل</p>
          <p className="text-2xl font-bold text-slate-800">{metadata.analysis_time_ms} مل‌ث</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2">نتيجة النموذج</h3>
        <div className="flex items-center gap-4">
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
            ml.label.toUpperCase() === 'AI'
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}>
            {ml.label.toUpperCase() === 'AI' ? 'ذكاء اصطناعي' : 'بشري'}
          </span>
          <span className="text-slate-500 text-sm">الثقة: {Math.round(ml.confidence * 100)}%</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">المؤشرات الإحصائية</h3>
        <div className="space-y-4">
          {Object.entries(indicatorLabels).map(([key, label]) => (
            <IndicatorBar
              key={key}
              label={label}
              value={statistical[key]}
              maxValue={indicatorMaxValues[key]}
            />
          ))}
        </div>
      </div>

      {sentences && sentences.length > 0 && (
        <SentenceHighlight sentences={sentences} />
      )}

      <button
        onClick={onBack}
        className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-lg font-semibold rounded-xl transition-colors border border-slate-200"
      >
        تحقق من نص آخر
      </button>
    </div>
  )
}

export default Report
