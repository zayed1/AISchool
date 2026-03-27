import os
import json
import numpy as np

from backend.utils.logging import get_logger

log = get_logger("ml_model")

# Primary model (Arabic-specific)
_session1 = None
_tokenizer1 = None
_label_map1 = None

# Secondary model (multilingual XLM-R)
_session2 = None
_tokenizer2 = None
_label_map2 = None

_ml_available = False
_dual_model = False

_ONNX_DIR1 = os.path.join(os.path.dirname(__file__), "onnx_model")
_ONNX_PATH1 = os.path.join(_ONNX_DIR1, "model.onnx")
_TOK_PATH1 = os.path.join(_ONNX_DIR1, "tokenizer.json")

_ONNX_DIR2 = os.path.join(os.path.dirname(__file__), "onnx_model2")
_ONNX_PATH2 = os.path.join(_ONNX_DIR2, "model.onnx")
_TOK_PATH2 = os.path.join(_ONNX_DIR2, "tokenizer.json")


def _load_single(onnx_path, tok_path, onnx_dir, name):
    import onnxruntime as ort
    from tokenizers import Tokenizer

    log.info(f"Loading {name} from {onnx_path}...")
    session = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])

    tokenizer = Tokenizer.from_file(tok_path)
    tokenizer.enable_padding(pad_id=0, pad_token="[PAD]")
    tokenizer.enable_truncation(max_length=512)

    label_path = os.path.join(onnx_dir, "label_map.json")
    if os.path.isfile(label_path):
        with open(label_path) as f:
            label_map = json.load(f)
    else:
        label_map = {"0": "HUMAN", "1": "AI"}

    log.info(f"{name} loaded OK (labels: {label_map})")
    return session, tokenizer, label_map


def load_model():
    global _session1, _tokenizer1, _label_map1
    global _session2, _tokenizer2, _label_map2
    global _ml_available, _dual_model

    if _session1 is not None:
        return True

    if not os.path.isfile(_ONNX_PATH1):
        log.warning(f"Primary model not found at {_ONNX_PATH1} — statistical-only mode")
        _ml_available = False
        return False

    try:
        _session1, _tokenizer1, _label_map1 = _load_single(
            _ONNX_PATH1, _TOK_PATH1, _ONNX_DIR1, "Primary (Arabic)"
        )
        _ml_available = True

        # Try loading secondary model (optional)
        if os.path.isfile(_ONNX_PATH2):
            try:
                _session2, _tokenizer2, _label_map2 = _load_single(
                    _ONNX_PATH2, _TOK_PATH2, _ONNX_DIR2, "Secondary (XLM-R)"
                )
                _dual_model = True
                log.info("Dual-model ensemble enabled")
            except Exception as e:
                log.warning(f"Secondary model failed: {e} — using primary only")
                _dual_model = False
        else:
            log.info("Secondary model not found — using primary only")

        return True

    except Exception as e:
        log.warning(f"Failed to load models: {e} — statistical-only mode")
        _ml_available = False
        return False


def is_model_loaded() -> bool:
    return _ml_available and _session1 is not None


def _softmax(logits):
    exp = np.exp(logits - np.max(logits, axis=-1, keepdims=True))
    return exp / exp.sum(axis=-1, keepdims=True)


def _find_ai_index(label_map):
    """Find which index corresponds to AI label."""
    for idx, label in label_map.items():
        if label.upper() in ("AI", "MACHINE", "GENERATED", "FAKE", "AI-GENERATED"):
            return int(idx)
    return 1  # default assumption


def _classify_with_model(texts, session, tokenizer, label_map):
    """Classify texts with a specific model. Returns list of AI scores (0-1)."""
    if not texts:
        return []

    encodings = tokenizer.encode_batch(texts)
    inputs = {
        "input_ids": np.array([e.ids for e in encodings], dtype=np.int64),
        "attention_mask": np.array([e.attention_mask for e in encodings], dtype=np.int64),
    }
    logits = session.run(None, inputs)[0]
    probs = _softmax(logits)

    ai_idx = _find_ai_index(label_map)
    scores = []
    for i in range(len(texts)):
        ai_prob = float(probs[i][ai_idx])
        scores.append(ai_prob)
    return scores


def _ensemble_classify(texts):
    """Classify using both models and ensemble the results."""
    scores1 = _classify_with_model(texts, _session1, _tokenizer1, _label_map1)

    if _dual_model:
        scores2 = _classify_with_model(texts, _session2, _tokenizer2, _label_map2)
        # Weighted average: primary 55%, secondary 45%
        # Primary is Arabic-specific, secondary provides generalization
        ensembled = [s1 * 0.55 + s2 * 0.45 for s1, s2 in zip(scores1, scores2)]
        return ensembled
    else:
        return scores1


def _classify(text):
    if not _ml_available:
        return {"label": "HUMAN", "score": 0.5}
    scores = _ensemble_classify([text])
    ai_score = scores[0]
    label = "AI" if ai_score >= 0.5 else "HUMAN"
    confidence = ai_score if label == "AI" else 1 - ai_score
    return {"label": label, "score": confidence}


# --- Sliding window ---
def _get_token_count(text):
    encoding = _tokenizer1.encode(text)
    return sum(1 for m in encoding.attention_mask if m == 1)


def _sliding_window_chunks(text, window_tokens=400, stride_tokens=200):
    if not _ml_available or _tokenizer1 is None:
        return [text]

    tok_count = _get_token_count(text)
    if tok_count <= window_tokens:
        return [text]

    words = text.split()
    chunks = []
    word_idx = 0

    while word_idx < len(words):
        chunk_words = []
        for j in range(word_idx, len(words)):
            chunk_words.append(words[j])
            if len(chunk_words) % 15 == 0:
                chunk_text = " ".join(chunk_words)
                if _get_token_count(chunk_text) >= window_tokens:
                    break

        chunks.append(" ".join(chunk_words))
        stride_words = max(1, len(chunk_words) * stride_tokens // window_tokens)
        word_idx += stride_words

    return chunks if chunks else [text]


def predict(text):
    if not _ml_available:
        return {"label": "HUMAN", "confidence": 0.5, "ml_score": 0.5}

    chunks = _sliding_window_chunks(text)

    # Ensemble classify all chunks at once
    ai_scores = _ensemble_classify(chunks)

    if len(ai_scores) == 1:
        ml_score = ai_scores[0]
    else:
        # Weighted ensemble by chunk length
        total_weight = 0.0
        weighted_score = 0.0
        for i, score in enumerate(ai_scores):
            chunk_len = len(chunks[i].split())
            weight = 0.5 + 0.5 * min(chunk_len / 100, 1.0)
            weighted_score += score * weight
            total_weight += weight

        ml_score = weighted_score / total_weight if total_weight > 0 else 0.5

        # D: Majority vote boost
        ai_chunks = sum(1 for s in ai_scores if s >= 0.5)
        agreement = max(ai_chunks, len(ai_scores) - ai_chunks) / len(ai_scores)
        if agreement >= 0.8:
            if ai_chunks > len(ai_scores) / 2:
                ml_score = ml_score * 0.7 + 0.3
            else:
                ml_score = ml_score * 0.7

    final_label = "AI" if ml_score >= 0.5 else "HUMAN"
    final_confidence = ml_score if final_label == "AI" else 1 - ml_score

    return {
        "label": final_label,
        "confidence": round(final_confidence, 3),
        "ml_score": round(ml_score, 3),
    }


# --- D: Sentence-level voting ---
_BATCH_SIZE = 16


def predict_sentences(sentences):
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

    # Process in batches with ensemble
    for batch_start in range(0, len(batch_texts), _BATCH_SIZE):
        batch = batch_texts[batch_start:batch_start + _BATCH_SIZE]
        indices = batch_indices[batch_start:batch_start + _BATCH_SIZE]

        try:
            ai_scores = _ensemble_classify(batch)
        except Exception:
            ai_scores = [0.5] * len(batch)

        for j, score in enumerate(ai_scores):
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
