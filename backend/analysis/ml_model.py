from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
from backend.config import MODEL_NAME

_classifier = None
_tokenizer = None


def load_model():
    global _classifier, _tokenizer
    if _classifier is None:
        _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        _model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
        _classifier = pipeline(
            "text-classification",
            model=_model,
            tokenizer=_tokenizer,
        )
    return _classifier


def is_model_loaded() -> bool:
    return _classifier is not None


def _chunk_text(text: str, max_tokens: int = 450) -> list[str]:
    """Split text into chunks that fit within the model's token limit."""
    if _tokenizer is None:
        load_model()

    tokens = _tokenizer.encode(text, add_special_tokens=False)
    if len(tokens) <= max_tokens:
        return [text]

    chunks = []
    for i in range(0, len(tokens), max_tokens):
        chunk_tokens = tokens[i:i + max_tokens]
        chunk_text = _tokenizer.decode(chunk_tokens, skip_special_tokens=True)
        chunks.append(chunk_text)

    return chunks


def predict(text: str) -> dict:
    classifier = load_model()

    chunks = _chunk_text(text)

    if len(chunks) == 1:
        result = classifier(chunks[0])[0]
        label = result["label"]
        confidence = result["score"]
        ml_score = confidence if label.upper() == "AI" else 1 - confidence
        return {
            "label": label,
            "confidence": round(confidence, 3),
            "ml_score": round(ml_score, 3),
        }

    total_weight = 0.0
    weighted_score = 0.0
    all_results = []

    for chunk in chunks:
        result = classifier(chunk)[0]
        label = result["label"]
        confidence = result["score"]
        chunk_ml_score = confidence if label.upper() == "AI" else 1 - confidence
        weight = confidence
        weighted_score += chunk_ml_score * weight
        total_weight += weight
        all_results.append(result)

    avg_ml_score = weighted_score / total_weight if total_weight > 0 else 0.5
    final_label = "AI" if avg_ml_score >= 0.5 else "HUMAN"
    final_confidence = avg_ml_score if final_label == "AI" else 1 - avg_ml_score

    return {
        "label": final_label,
        "confidence": round(final_confidence, 3),
        "ml_score": round(avg_ml_score, 3),
    }


def predict_sentences(sentences: list[str]) -> list[dict]:
    """Predict AI probability for individual sentences."""
    classifier = load_model()
    results = []

    for sentence in sentences:
        if len(sentence.split()) < 3:
            results.append({
                "text": sentence,
                "score": 0.5,
                "flag": "neutral",
            })
            continue

        try:
            result = classifier(sentence)[0]
            label = result["label"]
            confidence = result["score"]
            score = confidence if label.upper() == "AI" else 1 - confidence

            if score >= 0.7:
                flag = "high"
            elif score >= 0.4:
                flag = "medium"
            else:
                flag = "low"

            results.append({
                "text": sentence,
                "score": round(score, 2),
                "flag": flag,
            })
        except Exception:
            results.append({
                "text": sentence,
                "score": 0.5,
                "flag": "neutral",
            })

    return results
