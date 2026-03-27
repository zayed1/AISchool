import os
import re
import json
import random
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


# --- #3: Text normalization for better tokenizer accuracy ---
_TASHKEEL_RE = re.compile(r'[\u0617-\u061A\u064B-\u0652]')
_MULTI_SPACE_RE = re.compile(r'\s+')
_TATWEEL_RE = re.compile(r'\u0640+')  # kashida/tatweel


def _normalize_text(text: str) -> str:
    """Clean text before feeding to model for better accuracy."""
    t = text
    t = _TASHKEEL_RE.sub('', t)  # remove diacritics
    t = _TATWEEL_RE.sub('', t)   # remove tatweel
    # Normalize common Arabic char variants
    t = t.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا')
    t = t.replace('ة', 'ه')
    t = t.replace('ى', 'ي')
    t = _MULTI_SPACE_RE.sub(' ', t).strip()
    return t


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
        log.warning(f"Primary model not found — statistical-only mode")
        _ml_available = False
        return False

    try:
        _session1, _tokenizer1, _label_map1 = _load_single(
            _ONNX_PATH1, _TOK_PATH1, _ONNX_DIR1, "Primary (Arabic)"
        )
        _ml_available = True

        if os.path.isfile(_ONNX_PATH2):
            try:
                _session2, _tokenizer2, _label_map2 = _load_single(
                    _ONNX_PATH2, _TOK_PATH2, _ONNX_DIR2, "Secondary (XLM-R)"
                )
                _dual_model = True
                log.info("Dual-model ensemble enabled")
            except Exception as e:
                log.warning(f"Secondary model failed: {e}")
                _dual_model = False

        return True

    except Exception as e:
        log.warning(f"Failed to load models: {e}")
        _ml_available = False
        return False


def is_model_loaded() -> bool:
    return _ml_available and _session1 is not None


def _softmax(logits):
    exp = np.exp(logits - np.max(logits, axis=-1, keepdims=True))
    return exp / exp.sum(axis=-1, keepdims=True)


def _find_ai_index(label_map):
    for idx, label in label_map.items():
        if label.upper() in ("AI", "MACHINE", "GENERATED", "FAKE", "AI-GENERATED"):
            return int(idx)
    return 1


def _classify_with_model(texts, session, tokenizer, label_map):
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
    return [float(probs[i][ai_idx]) for i in range(len(texts))]


def _ensemble_classify(texts):
    scores1 = _classify_with_model(texts, _session1, _tokenizer1, _label_map1)
    if _dual_model:
        scores2 = _classify_with_model(texts, _session2, _tokenizer2, _label_map2)
        return [s1 * 0.55 + s2 * 0.45 for s1, s2 in zip(scores1, scores2)]
    return scores1


# --- #2: Multi-view analysis ---
def _generate_views(text: str, sentences: list[str] | None = None) -> list[str]:
    """Generate multiple text views for ensemble analysis."""
    views = [text]  # full text always included

    if not sentences:
        sentences = [s.strip() for s in re.split(r'[.؟!؛:\n]+', text) if s.strip() and len(s.split()) >= 3]

    if len(sentences) >= 4:
        # View: without first and last sentence (removes intro/conclusion)
        views.append(" ".join(sentences[1:-1]))

        # View: first half only
        mid = len(sentences) // 2
        views.append(" ".join(sentences[:mid]))

        # View: second half only
        views.append(" ".join(sentences[mid:]))

    if len(sentences) >= 6:
        # View: shuffled sentences (breaks flow, tests individual sentence quality)
        shuffled = sentences.copy()
        random.seed(42)  # deterministic for caching
        random.shuffle(shuffled)
        views.append(" ".join(shuffled))

    return views


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
                if _get_token_count(" ".join(chunk_words)) >= window_tokens:
                    break

        chunks.append(" ".join(chunk_words))
        stride_words = max(1, len(chunk_words) * stride_tokens // window_tokens)
        word_idx += stride_words

    return chunks if chunks else [text]


def predict(text):
    """Predict AI probability using multi-view + sliding window + dual-model ensemble."""
    if not _ml_available:
        return {"label": "HUMAN", "confidence": 0.5, "ml_score": 0.5}

    # #3: Normalize text
    clean_text = _normalize_text(text)

    # #2: Generate multiple views
    views = _generate_views(clean_text)

    # For each view, get sliding window chunks and classify
    all_scores = []
    view_weights = []

    for i, view in enumerate(views):
        chunks = _sliding_window_chunks(view)
        chunk_scores = _ensemble_classify(chunks)

        # Average chunks within this view
        if len(chunk_scores) == 1:
            view_score = chunk_scores[0]
        else:
            total_w = 0.0
            weighted_s = 0.0
            for j, score in enumerate(chunk_scores):
                w = 0.5 + 0.5 * min(len(chunks[j].split()) / 100, 1.0)
                weighted_s += score * w
                total_w += w
            view_score = weighted_s / total_w if total_w > 0 else 0.5

        all_scores.append(view_score)
        # First view (full text) gets highest weight
        view_weights.append(1.0 if i == 0 else 0.6)

    # Weighted average across views
    total_weight = sum(view_weights)
    ml_score = sum(s * w for s, w in zip(all_scores, view_weights)) / total_weight

    # Majority vote boost across views
    ai_views = sum(1 for s in all_scores if s >= 0.5)
    agreement = max(ai_views, len(all_scores) - ai_views) / len(all_scores)
    if agreement >= 0.8 and len(all_scores) >= 3:
        if ai_views > len(all_scores) / 2:
            ml_score = ml_score * 0.7 + 0.3
        else:
            ml_score = ml_score * 0.7

    # #1: Return raw ml_score + confidence for dynamic weighting in combiner
    ml_score = max(0.0, min(1.0, ml_score))
    final_label = "AI" if ml_score >= 0.5 else "HUMAN"
    final_confidence = ml_score if final_label == "AI" else 1 - ml_score

    return {
        "label": final_label,
        "confidence": round(final_confidence, 3),
        "ml_score": round(ml_score, 3),
    }


# --- Sentence prediction with ensemble ---
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
            batch_texts.append(_normalize_text(sentence))

    for batch_start in range(0, len(batch_texts), _BATCH_SIZE):
        batch = batch_texts[batch_start:batch_start + _BATCH_SIZE]
        indices = batch_indices[batch_start:batch_start + _BATCH_SIZE]

        try:
            ai_scores = _ensemble_classify(batch)
        except Exception:
            ai_scores = [0.5] * len(batch)

        for j, score in enumerate(ai_scores):
            flag = "high" if score >= 0.7 else "medium" if score >= 0.4 else "low"
            results[indices[j]] = {
                "text": sentences[indices[j]],  # return original text, not normalized
                "score": round(score, 2),
                "flag": flag,
            }

    return results
