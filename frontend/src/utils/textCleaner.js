// #5 — Auto text correction before analysis
// #41 — Enhanced smart paste cleaning with more patterns

export function cleanTextForAnalysis(text) {
  const changes = []
  let cleaned = text

  // Remove excessive blank lines (3+ → 2)
  const blanksBefore = (cleaned.match(/\n{3,}/g) || []).length
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  if (blanksBefore > 0) changes.push(`إزالة ${blanksBefore} أسطر فارغة زائدة`)

  // Normalize spaces (multiple → single)
  const spacesBefore = (cleaned.match(/[ \t]{2,}/g) || []).length
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ')
  if (spacesBefore > 0) changes.push(`توحيد ${spacesBefore} مسافات مزدوجة`)

  // Trim each line
  cleaned = cleaned.split('\n').map((l) => l.trim()).join('\n')

  // Remove leading/trailing whitespace
  cleaned = cleaned.trim()

  return { text: cleaned, changes }
}

export function smartPasteClean(text) {
  const changes = []
  let cleaned = text

  // Remove email headers
  const emailHeaders = /^(From|To|Subject|Date|Sent|Cc|Bcc):.*$/gm
  const headerMatches = cleaned.match(emailHeaders)
  if (headerMatches && headerMatches.length >= 2) {
    cleaned = cleaned.replace(emailHeaders, '')
    changes.push('إزالة رؤوس البريد الإلكتروني')
  }

  // Remove page numbers (standalone numbers on their own line)
  const pageNums = cleaned.match(/^\s*\d{1,4}\s*$/gm)
  if (pageNums && pageNums.length >= 2) {
    cleaned = cleaned.replace(/^\s*\d{1,4}\s*$/gm, '')
    changes.push(`إزالة ${pageNums.length} أرقام صفحات`)
  }

  // Remove footnote references [1], [2], etc.
  const footnotes = cleaned.match(/\[\d+\]/g)
  if (footnotes && footnotes.length >= 2) {
    cleaned = cleaned.replace(/\[\d+\]/g, '')
    changes.push(`إزالة ${footnotes.length} مراجع حواشي`)
  }

  // Remove URLs
  const urls = cleaned.match(/https?:\/\/\S+/g)
  if (urls) {
    cleaned = cleaned.replace(/https?:\/\/\S+/g, '')
    changes.push(`إزالة ${urls.length} روابط`)
  }

  // #41 — Remove zero-width and invisible unicode characters
  const invisibleBefore = cleaned.length
  cleaned = cleaned.replace(/[\u200B\u200C\u200D\u200E\u200F\uFEFF\u00AD]/g, '')
  const invisibleRemoved = invisibleBefore - cleaned.length
  if (invisibleRemoved > 0) {
    changes.push(`إزالة ${invisibleRemoved} حرف مخفي`)
  }

  // #41 — Remove common copy-paste artifacts (bullet chars, fancy quotes → plain)
  const bulletsBefore = (cleaned.match(/[•◦▪▸►◆★●○]/g) || []).length
  if (bulletsBefore > 0) {
    cleaned = cleaned.replace(/[•◦▪▸►◆★●○]\s*/g, '')
    changes.push(`إزالة ${bulletsBefore} رموز نقطية`)
  }

  // Normalize fancy quotes to simple ones
  const fancyQuotes = (cleaned.match(/[""''«»]/g) || []).length
  if (fancyQuotes > 2) {
    cleaned = cleaned.replace(/[""]/g, '"').replace(/['']/g, "'").replace(/[«»]/g, '"')
    changes.push('توحيد علامات الاقتباس')
  }

  // Remove repeated dashes/underscores (separators)
  const separators = cleaned.match(/[-_=]{5,}/g)
  if (separators) {
    cleaned = cleaned.replace(/[-_=]{5,}/g, '')
    changes.push(`إزالة ${separators.length} فواصل`)
  }

  // Clean up result
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim()

  return { text: cleaned, changes }
}
