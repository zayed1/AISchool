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
        _tokenizer.enable_padding(pad_id=0, pad_token="[PAD]")
        _tokenizer.enable_truncation(max_length=512)
        log.info("Tokenizer loaded OK (dynamic padding)")

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


def _tokenize_batch(texts: list[str]) -> dict:
    encodings = _tokenizer.encode_batch(texts)
    return {
        "input_ids": np.array([e.ids for e in encodings], dtype=np.int64),
        "attention_mask": np.array([e.attention_mask for e in encodings], dtype=np.int64),
    }


def _classify_batch(texts: list[str]) -> list[dict]:
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
    if not _ml_available or _session is None:
        return {"label": "HUMAN", "score": 0.5}
    results = _classify_batch([text])
    return results[0]


# --- Sliding window chunking for better accuracy ---
def _get_token_ids(text: str) -> list[int]:
    encoding = _tokenizer.encode(text)
    return [t for t, m in zip(encoding.ids, encoding.attention_mask) if m == 1]


def _sliding_window_chunks(text: str, window_tokens: int = 400, stride_tokens: int = 200) -> list[str]:
    """Split text into overlapping windows for ensemble prediction.
    Overlapping windows capture context at boundaries that fixed chunks miss."""
    if not _ml_available or _tokenizer is None:
        return [text]

    tokens = _get_token_ids(text)
    if len(tokens) <= window_tokens:
        return [text]

    # Use word-level splitting aligned with token boundaries
    words = text.split()
    chunks = []
    word_idx = 0

    while word_idx < len(words):
        # Build chunk up to window_tokens
        chunk_words = []
        for j in range(word_idx, len(words)):
            chunk_words.append(words[j])
            chunk_text = " ".join(chunk_words)
            toks = _get_token_ids(chunk_text)
            if len(toks) >= window_tokens:
                break

        chunks.append(" ".join(chunk_words))

        # Stride forward (not full window — overlap!)
        stride_words = max(1, len(chunk_words) * stride_tokens // window_tokens)
        word_idx += stride_words

    return chunks if chunks else [text]


def predict(text: str) -> dict:
    """Predict AI probability using sliding window ensemble for higher accuracy."""
    if not _ml_available:
        return {"label": "HUMAN", "confidence": 0.5, "ml_score": 0.5}

    chunks = _sliding_window_chunks(text)

    if len(chunks) == 1:
        result = _classify(chunks[0])
        label = result["label"]
        confidence = result["score"]
        ml_score = confidence if label.upper() == "AI" else 1 - confidence
        return {"label": label, "confidence": round(confidence, 3), "ml_score": round(ml_score, 3)}

    # Batch classify all chunks
    results = _classify_batch(chunks)

    # Weighted ensemble — longer chunks and higher confidence get more weight
    total_weight = 0.0
    weighted_score = 0.0

    for i, result in enumerate(results):
        label = result["label"]
        confidence = result["score"]
        chunk_ml_score = confidence if label.upper() == "AI" else 1 - confidence

        # Weight by confidence AND chunk length (longer = more reliable)
        chunk_len = len(chunks[i].split())
        weight = confidence * (0.5 + 0.5 * min(chunk_len / 100, 1.0))

        weighted_score += chunk_ml_score * weight
        total_weight += weight

    avg_ml_score = weighted_score / total_weight if total_weight > 0 else 0.5

    # Boost: if majority of chunks agree, increase confidence
    ai_chunks = sum(1 for r in results if r["label"].upper() == "AI")
    agreement_ratio = max(ai_chunks, len(results) - ai_chunks) / len(results)
    if agreement_ratio >= 0.8:
        # Strong agreement — push score toward the consensus
        if ai_chunks > len(results) / 2:
            avg_ml_score = avg_ml_score * 0.7 + 0.3  # push toward 1
        else:
            avg_ml_score = avg_ml_score * 0.7  # push toward 0

    final_label = "AI" if avg_ml_score >= 0.5 else "HUMAN"
    final_confidence = avg_ml_score if final_label == "AI" else 1 - avg_ml_score

    return {
        "label": final_label,
        "confidence": round(final_confidence, 3),
        "ml_score": round(avg_ml_score, 3),
    }


# --- Batch sentence prediction ---
_BATCH_SIZE = 16


def predict_sentences(sentences: list[str]) -> list[dict]:
    if not _ml_available:
        return [{"text": s, "score": 0.5, "flag": "neutral"} for s in sentences]

    results = []
    batch_indices = []
    batch_texts = []

    for i, sentence in enumerate(sentences):
        if len(sentence.split()) < 3:
            results.append({"text": sentence, "score": 0.5, "flag": "neutral"})
        else:
            results.append(None)
            batch_indices.append(i)
            batch_texts.append(sentence)

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
