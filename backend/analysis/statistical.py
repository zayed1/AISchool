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


# ========================
# D: Advanced detection indicators
# ========================

def calc_zipf_deviation(words: list[str]) -> float:
    """Measure how much word frequency deviates from Zipf's law.
    Human text closely follows Zipf's law (rank × frequency ≈ constant).
    AI text deviates because it distributes words more uniformly."""
    if len(words) < 20:
        return 0.0

    freq = Counter(words)
    sorted_freq = sorted(freq.values(), reverse=True)

    if len(sorted_freq) < 5:
        return 0.0

    # Zipf's law: frequency of rank r ≈ C / r
    # Calculate how well the actual distribution fits
    top_freq = sorted_freq[0]
    deviations = []
    for rank, actual_freq in enumerate(sorted_freq[:min(50, len(sorted_freq))], 1):
        expected = top_freq / rank
        if expected > 0:
            deviation = abs(actual_freq - expected) / expected
            deviations.append(deviation)

    return sum(deviations) / len(deviations) if deviations else 0.0


def calc_entropy(words: list[str]) -> float:
    """Shannon entropy of word distribution.
    AI text tends to have lower entropy (more predictable, uniform)."""
    if len(words) < 10:
        return 0.0

    freq = Counter(words)
    total = len(words)
    entropy = 0.0
    for count in freq.values():
        p = count / total
        if p > 0:
            entropy -= p * math.log2(p)

    # Normalize by max possible entropy
    max_entropy = math.log2(len(freq)) if len(freq) > 1 else 1.0
    return entropy / max_entropy if max_entropy > 0 else 0.0


def calc_hapax_ratio(words: list[str]) -> float:
    """Ratio of words that appear exactly once (hapax legomena).
    Human text has more unique one-time words. AI repeats vocabulary."""
    if len(words) < 20:
        return 0.0

    freq = Counter(words)
    hapax = sum(1 for count in freq.values() if count == 1)
    return hapax / len(freq) if freq else 0.0


def calc_mtld(words: list[str], threshold: float = 0.72) -> float:
    """Measure of Textual Lexical Diversity — more robust than TTR.
    Calculates how many consecutive words maintain TTR above threshold.
    Higher MTLD = more diverse vocabulary = more likely human."""
    if len(words) < 10:
        return 0.0

    def _mtld_forward(word_list):
        factors = 0
        current_types = set()
        current_tokens = 0

        for word in word_list:
            current_types.add(word)
            current_tokens += 1
            ttr = len(current_types) / current_tokens
            if ttr <= threshold:
                factors += 1
                current_types = set()
                current_tokens = 0

        # Partial factor
        if current_tokens > 0:
            ttr = len(current_types) / current_tokens
            if ttr < 1.0:
                factors += (1.0 - ttr) / (1.0 - threshold)

        return len(word_list) / factors if factors > 0 else len(word_list)

    forward = _mtld_forward(words)
    backward = _mtld_forward(words[::-1])
    return (forward + backward) / 2


def calc_consistency_score(sentences: list[str]) -> float:
    """Check if text is equally 'AI-like' in all parts.
    AI text is uniformly styled. Human text varies across sections.
    Returns 0-1: high = very consistent = AI-like."""
    if len(sentences) < 6:
        return 0.5

    # Calculate local TTR for each group of 3 sentences
    group_size = 3
    local_scores = []

    for i in range(0, len(sentences) - group_size + 1, group_size):
        group = sentences[i:i + group_size]
        group_words = []
        for s in group:
            group_words.extend(remove_tashkeel(s).split())
        if len(group_words) >= 5:
            local_ttr = len(set(group_words)) / len(group_words)
            local_scores.append(local_ttr)

    if len(local_scores) < 2:
        return 0.5

    # Low variance in local TTR = very consistent = AI-like
    mean_ttr = sum(local_scores) / len(local_scores)
    variance = sum((s - mean_ttr) ** 2 for s in local_scores) / len(local_scores)
    std = math.sqrt(variance)

    # Coefficient of variation
    cv = std / mean_ttr if mean_ttr > 0 else 0
    return max(0.0, min(1.0, 1.0 - cv * 3))  # invert: high consistency = high score


def _score_zipf(deviation: float) -> float:
    """Arabic Zipf deviation. Lower = follows Zipf = more human-like."""
    # Arabic text typically has high deviation values (5-10)
    # AI text has slightly lower deviation (more uniform distribution)
    if deviation <= 4.0:
        return 0.85  # too uniform = AI
    elif deviation <= 5.5:
        return 0.65
    elif deviation <= 7.0:
        return 0.4
    elif deviation <= 9.0:
        return 0.25
    else:
        return 0.15  # natural distribution = human


def _score_entropy(norm_entropy: float) -> float:
    """Arabic text entropy. AI slightly lower entropy."""
    if norm_entropy <= 0.93:
        return 0.8
    elif norm_entropy <= 0.96:
        return 0.6
    elif norm_entropy <= 0.98:
        return 0.4
    else:
        return 0.2  # very high entropy = human


def _score_hapax(ratio: float) -> float:
    """Hapax ratio for Arabic. AI uses fewer unique words."""
    if ratio <= 0.75:
        return 0.8
    elif ratio <= 0.85:
        return 0.6
    elif ratio <= 0.92:
        return 0.35
    else:
        return 0.15  # many unique words = human


def _score_mtld(mtld: float) -> float:
    """Low MTLD = repetitive vocabulary = AI."""
    if mtld <= 30:
        return 0.85
    elif mtld <= 50:
        return 0.65
    elif mtld <= 80:
        return 0.4
    elif mtld <= 120:
        return 0.25
    else:
        return 0.1  # very diverse = human


def _score_consistency(score: float) -> float:
    """High consistency = AI-like uniform style."""
    if score >= 0.9:
        return 0.9
    elif score >= 0.8:
        return 0.7
    elif score >= 0.6:
        return 0.45
    elif score >= 0.4:
        return 0.25
    else:
        return 0.15  # inconsistent = human


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

    # D — Advanced detection indicators
    zipf_dev = calc_zipf_deviation(words)
    entropy = calc_entropy(words)
    hapax = calc_hapax_ratio(words)
    mtld = calc_mtld(words)
    consistency = calc_consistency_score(sentences)

    # 20 indicators total — weights sum to 1.0
    weights = {
        "ttr": 0.07,
        "sentence_cv": 0.07,
        "openers": 0.07,
        "connectors": 0.07,
        "errors": 0.07,
        "burstiness": 0.06,
        "opener_diversity": 0.05,
        "subordinate": 0.03,
        "passive": 0.03,
        "avg_word_length": 0.03,
        "punctuation": 0.03,
        "trigram_rep": 0.04,
        "prepositions": 0.04,
        "pronouns": 0.05,
        "sent_variance": 0.04,
        # D — new
        "zipf": 0.06,
        "entropy": 0.05,
        "hapax": 0.04,
        "mtld": 0.05,
        "consistency": 0.05,
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
        + weights["zipf"] * _score_zipf(zipf_dev)
        + weights["entropy"] * _score_entropy(entropy)
        + weights["hapax"] * _score_hapax(hapax)
        + weights["mtld"] * _score_mtld(mtld)
        + weights["consistency"] * _score_consistency(consistency)
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
        "zipf_deviation": round(zipf_dev, 3),
        "entropy": round(entropy, 3),
        "hapax_ratio": round(hapax, 3),
        "mtld": round(mtld, 1),
        "consistency": round(consistency, 3),
        "statistical_score": round(statistical_score, 2),
    }
