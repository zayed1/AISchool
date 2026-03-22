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


def split_sentences(text: str) -> list[str]:
    parts = re.split(r'[.؟!،\n]+', text)
    return [s.strip() for s in parts if s.strip() and len(s.strip().split()) >= 2]


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
    ]

    count = 0
    for sentence in sentences:
        cleaned = remove_tashkeel(sentence.strip())
        for opener in ai_openers:
            if cleaned.startswith(opener):
                count += 1
                break

    return count / len(sentences)


def calc_connector_density(sentences: list[str]) -> float:
    if not sentences:
        return 0.0

    connectors = [
        "ومع ذلك", "بالتالي", "لذلك", "إضافة إلى", "فضلاً عن",
        "نتيجة لذلك", "في المقابل", "من ناحية أخرى", "علاوة على ذلك",
        "بالإضافة إلى", "على الرغم من", "بينما", "حيث أن", "كما أن",
        "إذ أن", "مما يعني", "وبالتالي", "ولذلك", "ومن ثم",
        "هذا بالإضافة إلى", "الأمر الذي", "وهو ما",
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

    error_patterns = [
        (r'إن شاء الله', 'إنشاء الله'),
        (r'هاذا', 'هذا'),
        (r'هاذه', 'هذه'),
        (r'لاكن', 'لكن'),
    ]

    ta_marbuta_words_ending_ha = 0
    for word in words:
        if word.endswith('ه') and len(word) > 2:
            ta_marbuta_words_ending_ha += 1

    text = " ".join(words)
    error_count = 0
    for _, wrong in error_patterns:
        error_count += text.count(wrong)

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


def _score_ttr(ttr: float) -> float:
    if ttr <= 0.3:
        return 0.95
    elif ttr <= 0.4:
        return 0.75
    elif ttr <= 0.5:
        return 0.55
    elif ttr <= 0.6:
        return 0.35
    else:
        return 0.15


def _score_cv(cv: float) -> float:
    if cv <= 0.2:
        return 0.9
    elif cv <= 0.3:
        return 0.7
    elif cv <= 0.4:
        return 0.5
    elif cv <= 0.5:
        return 0.3
    else:
        return 0.15


def _score_openers(ratio: float) -> float:
    return min(ratio * 4, 1.0)


def _score_connectors(density: float) -> float:
    if density <= 0.5:
        return 0.1
    elif density <= 1.0:
        return 0.3
    elif density <= 2.0:
        return 0.5
    elif density <= 3.0:
        return 0.7
    else:
        return 0.9


def _score_errors(ratio: float) -> float:
    if ratio >= 0.05:
        return 0.1
    elif ratio >= 0.02:
        return 0.3
    elif ratio >= 0.01:
        return 0.5
    elif ratio >= 0.005:
        return 0.7
    else:
        return 0.9


def _score_burstiness(burstiness: float) -> float:
    if burstiness <= 0.15:
        return 0.9
    elif burstiness <= 0.25:
        return 0.7
    elif burstiness <= 0.35:
        return 0.5
    elif burstiness <= 0.5:
        return 0.3
    else:
        return 0.15


def analyze(text: str) -> dict:
    words = get_words(text)
    sentences = split_sentences(text)

    ttr = calc_ttr(words)
    sentence_cv = calc_sentence_length_cv(sentences)
    openers_ratio = calc_repetitive_openers(sentences)
    connector_density = calc_connector_density(sentences)
    error_ratio = calc_error_ratio(words)
    burstiness = calc_burstiness(sentences)

    weights = {
        "ttr": 0.20,
        "sentence_cv": 0.20,
        "openers": 0.15,
        "connectors": 0.15,
        "errors": 0.15,
        "burstiness": 0.15,
    }

    statistical_score = (
        weights["ttr"] * _score_ttr(ttr)
        + weights["sentence_cv"] * _score_cv(sentence_cv)
        + weights["openers"] * _score_openers(openers_ratio)
        + weights["connectors"] * _score_connectors(connector_density)
        + weights["errors"] * _score_errors(error_ratio)
        + weights["burstiness"] * _score_burstiness(burstiness)
    )

    return {
        "ttr": round(ttr, 3),
        "sentence_length_cv": round(sentence_cv, 3),
        "repetitive_openers_ratio": round(openers_ratio, 3),
        "connector_density": round(connector_density, 3),
        "error_ratio": round(error_ratio, 4),
        "burstiness": round(burstiness, 3),
        "statistical_score": round(statistical_score, 2),
    }
