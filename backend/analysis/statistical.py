import re
import math
from collections import Counter


def remove_tashkeel(text: str) -> str:
    tashkeel = re.compile(r'[\u0617-\u061A\u064B-\u0652]')
    return tashkeel.sub('', text)


def clean_text(text: str) -> str:
    text = remove_tashkeel(text)
    text = re.sub(r'[^\u0600-\u06FF\s]', '', text)
    return text


def get_words(text: str) -> list[str]:
    cleaned = clean_text(text)
    return [w for w in cleaned.split() if w]


# #13 — Improved sentence splitting with more delimiters
def split_sentences(text: str) -> list[str]:
    # Support: period, question mark, exclamation, semicolon, colon (Arabic), newlines
    parts = re.split(r'[.؟!؛:\n]+', text)
    # Also split on Arabic comma if sentence is very long
    result = []
    for part in parts:
        stripped = part.strip()
        if not stripped or len(stripped.split()) < 2:
            continue
        # If sentence is very long (>40 words), try splitting on Arabic comma
        if len(stripped.split()) > 40:
            sub_parts = re.split(r'،', stripped)
            for sp in sub_parts:
                sp = sp.strip()
                if sp and len(sp.split()) >= 2:
                    result.append(sp)
        else:
            result.append(stripped)
    return result


def calc_ttr(words: list[str]) -> float:
    if not words:
        return 0.0
    unique = set(words)
    return len(unique) / len(words)


def calc_sentence_length_cv(sentences: list[str]) -> float:
    if len(sentences) < 2:
        return 0.0
    lengths = [len(s.split()) for s in sentences]
    mean = sum(lengths) / len(lengths)
    if mean == 0:
        return 0.0
    variance = sum((l - mean) ** 2 for l in lengths) / len(lengths)
    std = math.sqrt(variance)
    return std / mean


# #14 — Expanded AI openers list
def calc_repetitive_openers(sentences: list[str]) -> float:
    if not sentences:
        return 0.0

    ai_openers = [
        "بالإضافة إلى ذلك",
        "من الجدير بالذكر",
        "في هذا السياق",
        "علاوة على ذلك",
        "من المهم أن",
        "يمكن القول إن",
        "من ناحية أخرى",
        "في الختام",
        "بشكل عام",
        "على سبيل المثال",
        "من هذا المنطلق",
        "تجدر الإشارة إلى",
        "لا بد من",
        "في واقع الأمر",
        "مما لا شك فيه",
        # New openers
        "وفي هذا الإطار",
        "في ضوء ما سبق",
        "يُعدّ",
        "يُعد",
        "تُعدّ",
        "تُعد",
        "من المعروف أن",
        "لا يخفى على أحد",
        "في السياق ذاته",
        "وبناءً على ذلك",
    ]

    count = 0
    for sentence in sentences:
        cleaned = remove_tashkeel(sentence.strip())
        for opener in ai_openers:
            if cleaned.startswith(opener):
                count += 1
                break

    return count / len(sentences)


# #14 — Expanded connectors list
def calc_connector_density(sentences: list[str]) -> float:
    if not sentences:
        return 0.0

    connectors = [
        "ومع ذلك", "بالتالي", "لذلك", "إضافة إلى", "فضلاً عن",
        "نتيجة لذلك", "في المقابل", "من ناحية أخرى", "علاوة على ذلك",
        "بالإضافة إلى", "على الرغم من", "بينما", "حيث أن", "كما أن",
        "إذ أن", "مما يعني", "وبالتالي", "ولذلك", "ومن ثم",
        "هذا بالإضافة إلى", "الأمر الذي", "وهو ما",
        # New connectors
        "وفي الوقت نفسه", "بالمثل", "على نحو مماثل",
        "في حين أن", "بغض النظر عن", "وعلى صعيد آخر",
        "وتأسيساً على", "انطلاقاً من", "استناداً إلى",
        "وفي هذا الصدد",
    ]

    full_text = " ".join(sentences)
    cleaned = remove_tashkeel(full_text)
    count = 0
    for connector in connectors:
        count += len(re.findall(re.escape(connector), cleaned))

    return count / len(sentences)


def calc_error_ratio(words: list[str]) -> float:
    if not words:
        return 0.0

    # B17 — Expanded error patterns common in human Arabic writing
    error_patterns = [
        ('إنشاء الله', 'إن شاء الله'),
        ('هاذا', 'هذا'),
        ('هاذه', 'هذه'),
        ('لاكن', 'لكن'),
        ('ضروري', 'ضروري'),  # placeholder
    ]

    # Common human misspellings
    human_misspellings = [
        'إنشالله', 'انشاء الله', 'هاض', 'هاي', 'ليه', 'ايش',
        'وش', 'كذا', 'عشان', 'علشان', 'بالزات', 'لأنو',
        'لانه', 'هادا', 'داك', 'ذاك', 'هيك', 'هيج',
    ]

    ta_marbuta_words_ending_ha = 0
    for word in words:
        if word.endswith('ه') and len(word) > 2:
            ta_marbuta_words_ending_ha += 1

    text = " ".join(words)
    error_count = 0
    for wrong, _ in error_patterns:
        error_count += text.count(wrong)

    # Count human misspelling patterns
    for misspelling in human_misspellings:
        error_count += text.count(misspelling)

    hamza_errors = len(re.findall(r'ء[اوي]', text))
    error_count += hamza_errors

    total_errors = error_count + (ta_marbuta_words_ending_ha * 0.1)
    return total_errors / len(words)


def calc_burstiness(sentences: list[str], chunk_size: int = 5) -> float:
    if len(sentences) < chunk_size * 2:
        return 0.5

    chunks = []
    for i in range(0, len(sentences), chunk_size):
        chunk = sentences[i:i + chunk_size]
        word_count = sum(len(s.split()) for s in chunk)
        chunks.append(word_count)

    if len(chunks) < 2:
        return 0.5

    mean = sum(chunks) / len(chunks)
    if mean == 0:
        return 0.0
    variance = sum((c - mean) ** 2 for c in chunks) / len(chunks)
    std = math.sqrt(variance)
    return std / mean


# #2 — New indicator: paragraph opener diversity
def calc_paragraph_opener_diversity(sentences: list[str]) -> float:
    """Measures how diverse the first words of sentences are. AI tends to start similarly."""
    if len(sentences) < 3:
        return 0.5
    first_words = [remove_tashkeel(s.strip().split()[0]) for s in sentences if s.strip()]
    if not first_words:
        return 0.5
    unique_ratio = len(set(first_words)) / len(first_words)
    return round(unique_ratio, 3)


# #2 — New indicator: subordinate clause ratio
def calc_subordinate_ratio(sentences: list[str]) -> float:
    """Ratio of sentences containing subordinate clauses (relative pronouns, conjunctions)."""
    if not sentences:
        return 0.0
    subordinate_markers = ['الذي', 'التي', 'اللذين', 'اللتين', 'الذين', 'اللاتي', 'اللواتي',
                           'حيث', 'عندما', 'بينما', 'إذا', 'لأن', 'كي', 'حتى', 'مما', 'مع أن']
    count = 0
    for s in sentences:
        cleaned = remove_tashkeel(s)
        if any(marker in cleaned for marker in subordinate_markers):
            count += 1
    return round(count / len(sentences), 3)


# #2 — New indicator: passive voice ratio
def calc_passive_ratio(sentences: list[str]) -> float:
    """Estimate passive voice usage in Arabic (يُفعل pattern)."""
    if not sentences:
        return 0.0
    text = " ".join(sentences)
    words = text.split()
    if not words:
        return 0.0
    # Arabic passive patterns: يُ، تُ at start of verbs
    passive_count = 0
    for w in words:
        clean = remove_tashkeel(w)
        if len(clean) >= 3 and clean[0] in 'يت' and len(re.findall(r'[\u064F\u064C]', w)) > 0:
            passive_count += 1
        # Also check common passive patterns
        if any(clean.startswith(p) for p in ['يُ', 'تُ', 'يتم', 'تتم']):
            passive_count += 1
    return round(passive_count / len(words), 4)


# B15 — New indicator: average word length (AI tends to use longer formal words)
def calc_avg_word_length(words: list[str]) -> float:
    if not words:
        return 0.0
    return sum(len(w) for w in words) / len(words)


# B15 — New indicator: punctuation density (humans use more varied punctuation)
def calc_punctuation_density(text: str) -> float:
    words = text.split()
    if not words:
        return 0.0
    punct_count = len(re.findall(r'[،؛؟!.,:;\-–—…\(\)\[\]«»""\']', text))
    return punct_count / len(words)


# B16 — New indicator: trigram repetition ratio
def calc_trigram_repetition(sentences: list[str]) -> float:
    """Measures repeated 3-word sequences. AI text has more repeated n-grams."""
    if not sentences:
        return 0.0
    text = " ".join(sentences)
    words = [remove_tashkeel(w) for w in text.split() if w]
    if len(words) < 6:
        return 0.0
    trigrams = [" ".join(words[i:i+3]) for i in range(len(words) - 2)]
    counts = Counter(trigrams)
    repeated = sum(c - 1 for c in counts.values() if c > 1)
    return round(repeated / len(trigrams), 4) if trigrams else 0.0


def _score_avg_word_length(avg_len: float) -> float:
    """AI uses longer, more formal words."""
    if avg_len >= 5.5:
        return 0.85
    elif avg_len >= 4.5:
        return 0.6
    elif avg_len >= 3.5:
        return 0.35
    else:
        return 0.15


def _score_punctuation_density(density: float) -> float:
    """Low punctuation = more AI-like (AI uses minimal punctuation)."""
    if density <= 0.03:
        return 0.8
    elif density <= 0.06:
        return 0.5
    elif density <= 0.1:
        return 0.3
    else:
        return 0.15


def _score_trigram_repetition(ratio: float) -> float:
    """Higher repetition = more AI-like."""
    if ratio >= 0.03:
        return 0.9
    elif ratio >= 0.015:
        return 0.65
    elif ratio >= 0.005:
        return 0.4
    else:
        return 0.15


# C: New Arabic-specific indicators

def calc_preposition_density(text: str) -> float:
    """Arabic prepositions density — AI overuses formal prepositions."""
    prepositions = ['في', 'من', 'إلى', 'على', 'عن', 'مع', 'بين', 'خلال', 'ضمن', 'نحو', 'حول', 'تجاه', 'لدى', 'عبر', 'دون']
    words = text.split()
    if not words:
        return 0.0
    count = sum(1 for w in words if remove_tashkeel(w) in prepositions)
    return count / len(words)


def calc_pronoun_ratio(text: str) -> float:
    """First-person pronoun usage — humans use more personal pronouns."""
    personal = ['أنا', 'أنت', 'أنتِ', 'نحن', 'أنتم', 'هم', 'هي', 'هو', 'لي', 'لنا', 'عندي', 'عندنا']
    words = text.split()
    if not words:
        return 0.0
    count = sum(1 for w in words if remove_tashkeel(w) in personal)
    return count / len(words)


def calc_sentence_length_variance(sentences: list[str]) -> float:
    """Raw variance in sentence word counts — AI is unnaturally uniform."""
    if len(sentences) < 3:
        return 0.0
    lengths = [len(s.split()) for s in sentences]
    mean = sum(lengths) / len(lengths)
    if mean == 0:
        return 0.0
    variance = sum((l - mean) ** 2 for l in lengths) / len(lengths)
    return variance


def _score_preposition_density(density: float) -> float:
    """High preposition density = more formal/AI-like."""
    if density >= 0.12:
        return 0.85
    elif density >= 0.08:
        return 0.6
    elif density >= 0.05:
        return 0.4
    else:
        return 0.2


def _score_pronoun_ratio(ratio: float) -> float:
    """Low pronoun usage = AI-like (AI avoids first-person)."""
    if ratio <= 0.005:
        return 0.85  # almost no personal pronouns = AI
    elif ratio <= 0.01:
        return 0.6
    elif ratio <= 0.02:
        return 0.35
    else:
        return 0.1  # lots of pronouns = very human


def _score_sentence_variance(variance: float) -> float:
    """Low variance = AI-like uniform sentence lengths."""
    if variance <= 5:
        return 0.9  # extremely uniform = AI
    elif variance <= 15:
        return 0.7
    elif variance <= 30:
        return 0.4
    else:
        return 0.15  # high variance = human


def _score_ttr(ttr: float) -> float:
    # AI text often has HIGH TTR (formal, no repetition) OR very LOW (template)
    # Human text is moderate. Both extremes are suspicious.
    if ttr <= 0.3: return 0.9
    elif ttr <= 0.4: return 0.7
    elif ttr <= 0.5: return 0.5
    elif ttr <= 0.65: return 0.35
    elif ttr <= 0.75: return 0.55  # suspiciously high = AI
    else: return 0.7  # very high = likely AI


def _score_cv(cv: float) -> float:
    if cv <= 0.2: return 0.9
    elif cv <= 0.3: return 0.7
    elif cv <= 0.4: return 0.5
    elif cv <= 0.5: return 0.3
    else: return 0.15


def _score_openers(ratio: float) -> float:
    return min(ratio * 4, 1.0)


def _score_connectors(density: float) -> float:
    if density <= 0.5: return 0.1
    elif density <= 1.0: return 0.3
    elif density <= 2.0: return 0.5
    elif density <= 3.0: return 0.7
    else: return 0.9


def _score_errors(ratio: float) -> float:
    # AI text has almost ZERO errors — that's a strong signal
    if ratio >= 0.05: return 0.05
    elif ratio >= 0.02: return 0.15
    elif ratio >= 0.01: return 0.35
    elif ratio >= 0.005: return 0.6
    elif ratio >= 0.001: return 0.8
    else: return 0.95  # zero errors = very likely AI


def _score_burstiness(burstiness: float) -> float:
    if burstiness <= 0.15: return 0.9
    elif burstiness <= 0.25: return 0.7
    elif burstiness <= 0.35: return 0.5
    elif burstiness <= 0.5: return 0.3
    else: return 0.15


def _score_opener_diversity(diversity: float) -> float:
    """Both extremes are suspicious. Low = repetitive AI. Very high = unnaturally varied AI."""
    if diversity <= 0.3: return 0.9
    elif diversity <= 0.5: return 0.7
    elif diversity <= 0.7: return 0.4
    elif diversity <= 0.85: return 0.25
    else: return 0.45  # perfect diversity is also suspicious


def _score_subordinate(ratio: float) -> float:
    """AI uses fewer subordinate clauses — moderate is human."""
    if ratio <= 0.1: return 0.7
    elif ratio <= 0.25: return 0.4
    elif ratio <= 0.5: return 0.2
    else: return 0.15


def _score_passive(ratio: float) -> float:
    """AI uses more passive voice."""
    if ratio >= 0.08: return 0.8
    elif ratio >= 0.04: return 0.5
    elif ratio >= 0.02: return 0.3
    else: return 0.15


def analyze(text: str) -> dict:
    words = get_words(text)
    sentences = split_sentences(text)

    ttr = calc_ttr(words)
    sentence_cv = calc_sentence_length_cv(sentences)
    openers_ratio = calc_repetitive_openers(sentences)
    connector_density = calc_connector_density(sentences)
    error_ratio = calc_error_ratio(words)
    burstiness = calc_burstiness(sentences)
    opener_diversity = calc_paragraph_opener_diversity(sentences)
    subordinate_ratio = calc_subordinate_ratio(sentences)
    passive_ratio = calc_passive_ratio(sentences)

    # B15/B16 — Additional indicators
    avg_word_len = calc_avg_word_length(words)
    punct_density = calc_punctuation_density(text)
    trigram_rep = calc_trigram_repetition(sentences)

    # C — Arabic-specific indicators
    preposition_density = calc_preposition_density(text)
    pronoun_ratio = calc_pronoun_ratio(text)
    sent_variance = calc_sentence_length_variance(sentences)

    # 15 indicators total — weights sum to 1.0
    weights = {
        "ttr": 0.10,
        "sentence_cv": 0.10,
        "openers": 0.09,
        "connectors": 0.09,
        "errors": 0.09,
        "burstiness": 0.08,
        "opener_diversity": 0.06,
        "subordinate": 0.04,
        "passive": 0.04,
        "avg_word_length": 0.04,
        "punctuation": 0.04,
        "trigram_rep": 0.05,
        "prepositions": 0.06,
        "pronouns": 0.07,
        "sent_variance": 0.05,
    }

    statistical_score = (
        weights["ttr"] * _score_ttr(ttr)
        + weights["sentence_cv"] * _score_cv(sentence_cv)
        + weights["openers"] * _score_openers(openers_ratio)
        + weights["connectors"] * _score_connectors(connector_density)
        + weights["errors"] * _score_errors(error_ratio)
        + weights["burstiness"] * _score_burstiness(burstiness)
        + weights["opener_diversity"] * _score_opener_diversity(opener_diversity)
        + weights["subordinate"] * _score_subordinate(subordinate_ratio)
        + weights["passive"] * _score_passive(passive_ratio)
        + weights["avg_word_length"] * _score_avg_word_length(avg_word_len)
        + weights["punctuation"] * _score_punctuation_density(punct_density)
        + weights["trigram_rep"] * _score_trigram_repetition(trigram_rep)
        + weights["prepositions"] * _score_preposition_density(preposition_density)
        + weights["pronouns"] * _score_pronoun_ratio(pronoun_ratio)
        + weights["sent_variance"] * _score_sentence_variance(sent_variance)
    )

    return {
        "ttr": round(ttr, 3),
        "sentence_length_cv": round(sentence_cv, 3),
        "repetitive_openers_ratio": round(openers_ratio, 3),
        "connector_density": round(connector_density, 3),
        "error_ratio": round(error_ratio, 4),
        "burstiness": round(burstiness, 3),
        "opener_diversity": round(opener_diversity, 3),
        "subordinate_ratio": round(subordinate_ratio, 3),
        "passive_ratio": round(passive_ratio, 4),
        "avg_word_length": round(avg_word_len, 2),
        "punctuation_density": round(punct_density, 3),
        "trigram_repetition": round(trigram_rep, 4),
        "preposition_density": round(preposition_density, 3),
        "pronoun_ratio": round(pronoun_ratio, 3),
        "sentence_variance": round(sent_variance, 1),
        "statistical_score": round(statistical_score, 2),
    }
