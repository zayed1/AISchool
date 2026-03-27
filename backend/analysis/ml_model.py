import os
import json
import numpy as np

from backend.utils.logging import get_logger

log = get_logger("ml_model")

_session = None
_tokenizer = None
_label_map = None
_ml_available = False

_ONNX_DIR = os.path.join(os.path.dirname(__file__), "onnx_model")
_ONNX_PATH = os.path.join(_ONNX_DIR, "model.onnx")
_TOKENIZER_PATH = os.path.join(_ONNX_DIR, "tokenizer.json")


def load_model():
    """Load ONNX model + lightweight tokenizer. Returns True if loaded, False otherwise."""
    global _session, _tokenizer, _label_map, _ml_available

    if _session is not None:
        return True

    if not os.path.isfile(_ONNX_PATH):
        log.warning(f"ONNX model not found at {_ONNX_PATH} — statistical-only mode")
        _ml_available = False
        return False

    try:
        import onnxruntime as ort
        log.info(f"Loading ONNX model from {_ONNX_PATH}...")
        _session = ort.InferenceSession(
            _ONNX_PATH,
            providers=["CPUExecutionProvider"],
        )
        log.info("ONNX session created OK")

        from tokenizers import Tokenizer
        _tokenizer = Tokenizer.from_file(_TOKENIZER_PATH)
        # Dynamic padding — pad to longest in batch, not fixed 512
        # This preserves signal for short texts instead of drowning in padding
        _tokenizer.enable_padding(pad_id=0, pad_token="[PAD]")
        _tokenizer.enable_truncation(max_length=512)
        log.info("Tokenizer loaded OK (lightweight, dynamic padding)")

        label_path = os.path.join(_ONNX_DIR, "label_map.json")
        if os.path.isfile(label_path):
            with open(label_path) as f:
                _label_map = json.load(f)
        else:
            _label_map = {"0": "HUMAN", "1": "AI"}

        _ml_available = True
        log.info("ML model fully loaded")
        return True

    except Exception as e:
        log.warning(f"Failed to load model: {e} — statistical-only mode")
        _session = None
        _tokenizer = None
        _ml_available = False
        return False


def is_model_loaded() -> bool:
    return _ml_available and _session is not None


def _softmax(logits):
    exp = np.exp(logits - np.max(logits, axis=-1, keepdims=True))
    return exp / exp.sum(axis=-1, keepdims=True)


def _tokenize(text: str) -> dict:
    """Tokenize single text. Returns numpy arrays."""
    encoding = _tokenizer.encode(text)
    return {
        "input_ids": np.array([encoding.ids], dtype=np.int64),
        "attention_mask": np.array([encoding.attention_mask], dtype=np.int64),
    }


# B2 — Batch tokenize and infer multiple texts at once
def _tokenize_batch(texts: list[str]) -> dict:
    """Tokenize multiple texts as a batch. Returns padded numpy arrays."""
    encodings = _tokenizer.encode_batch(texts)
    return {
        "input_ids": np.array([e.ids for e in encodings], dtype=np.int64),
        "attention_mask": np.array([e.attention_mask for e in encodings], dtype=np.int64),
    }


def _classify_batch(texts: list[str]) -> list[dict]:
    """Classify multiple texts in a single ONNX inference call."""
    if not _ml_available or _session is None or not texts:
        return [{"label": "HUMAN", "score": 0.5} for _ in texts]

    inputs = _tokenize_batch(texts)
    logits = _session.run(None, inputs)[0]
    probs = _softmax(logits)

    results = []
    for i in range(len(texts)):
        predicted_idx = int(np.argmax(probs[i]))
        label = _label_map.get(str(predicted_idx), "HUMAN")
        confidence = float(probs[i][predicted_idx])
        results.append({"label": label, "score": confidence})
    return results


def _classify(text: str) -> dict:
    """Classify a single text. Returns {label, score}."""
    if not _ml_available or _session is None:
        return {"label": "HUMAN", "score": 0.5}

    inputs = _tokenize(text)
    logits = _session.run(None, inputs)[0]
    probs = _softmax(logits)[0]

    predicted_idx = int(np.argmax(probs))
    label = _label_map.get(str(predicted_idx), "HUMAN")
    confidence = float(probs[predicted_idx])

    return {"label": label, "score": confidence}


def _get_token_count(text: str) -> int:
    encoding = _tokenizer.encode(text)
    return sum(1 for t in encoding.attention_mask if t == 1)


def _chunk_text(text: str, max_tokens: int = 450) -> list[str]:
    if not _ml_available or _tokenizer is None:
        return [text]

    token_count = _get_token_count(text)
    if token_count <= max_tokens:
        return [text]

    words = text.split()
    chunks = []
    current_words = []

    for word in words:
        current_words.append(word)
        if len(current_words) % 20 == 0:
            chunk_text = " ".join(current_words)
            if _get_token_count(chunk_text) >= max_tokens:
                chunks.append(" ".join(current_words[:-1]))
                current_words = [word]

    if current_words:
        chunks.append(" ".join(current_words))

    return chunks if chunks else [text]


def predict(text: str) -> dict:
    """Predict AI probability. Returns neutral 0.5 if ML model unavailable."""
    if not _ml_available:
        return {"label": "HUMAN", "confidence": 0.5, "ml_score": 0.5}

    chunks = _chunk_text(text)

    if len(chunks) == 1:
        result = _classify(chunks[0])
        label = result["label"]
        confidence = result["score"]
        ml_score = confidence if label.upper() == "AI" else 1 - confidence
        return {"label": label, "confidence": round(confidence, 3), "ml_score": round(ml_score, 3)}

    # B2 — Batch inference for multi-chunk texts
    results = _classify_batch(chunks)

    total_weight = 0.0
    weighted_score = 0.0

    for result in results:
        label = result["label"]
        confidence = result["score"]
        chunk_ml_score = confidence if label.upper() == "AI" else 1 - confidence
        weight = confidence
        weighted_score += chunk_ml_score * weight
        total_weight += weight

    avg_ml_score = weighted_score / total_weight if total_weight > 0 else 0.5
    final_label = "AI" if avg_ml_score >= 0.5 else "HUMAN"
    final_confidence = avg_ml_score if final_label == "AI" else 1 - avg_ml_score

    return {"label": final_label, "confidence": round(final_confidence, 3), "ml_score": round(avg_ml_score, 3)}


# B2 — Batch sentence prediction
_BATCH_SIZE = 16


def predict_sentences(sentences: list[str]) -> list[dict]:
    """Predict AI probability for sentences using batch inference."""
    if not _ml_available:
        return [{"text": s, "score": 0.5, "flag": "neutral"} for s in sentences]

    results = []
    # Separate short sentences (skip ML) from normal ones
    batch_indices = []
    batch_texts = []

    for i, sentence in enumerate(sentences):
        if len(sentence.split()) < 3:
            results.append({"text": sentence, "score": 0.5, "flag": "neutral"})
        else:
            results.append(None)  # placeholder
            batch_indices.append(i)
            batch_texts.append(sentence)

    # B2 — Process in batches
    for batch_start in range(0, len(batch_texts), _BATCH_SIZE):
        batch = batch_texts[batch_start:batch_start + _BATCH_SIZE]
        indices = batch_indices[batch_start:batch_start + _BATCH_SIZE]

        try:
            classifications = _classify_batch(batch)
        except Exception:
            classifications = [{"label": "HUMAN", "score": 0.5}] * len(batch)

        for j, cls_result in enumerate(classifications):
            label = cls_result["label"]
            confidence = cls_result["score"]
            score = confidence if label.upper() == "AI" else 1 - confidence

            if score >= 0.7:
                flag = "high"
            elif score >= 0.4:
                flag = "medium"
            else:
                flag = "low"

            results[indices[j]] = {
                "text": batch[j],
                "score": round(score, 2),
                "flag": flag,
            }

    return results
