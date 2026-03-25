import os
import json
import numpy as np
from transformers import AutoTokenizer
import onnxruntime as ort

from backend.config import MODEL_NAME

_session = None
_tokenizer = None
_label_map = None

_ONNX_DIR = os.path.join(os.path.dirname(__file__), "onnx_model")
_ONNX_PATH = os.path.join(_ONNX_DIR, "model.onnx")


def load_model():
    global _session, _tokenizer, _label_map

    if _session is not None:
        return _session

    if os.path.isfile(_ONNX_PATH):
        # Load ONNX model
        _session = ort.InferenceSession(
            _ONNX_PATH,
            providers=["CPUExecutionProvider"],
        )
        _tokenizer = AutoTokenizer.from_pretrained(_ONNX_DIR)
        label_path = os.path.join(_ONNX_DIR, "label_map.json")
        if os.path.isfile(label_path):
            with open(label_path) as f:
                _label_map = json.load(f)
        else:
            _label_map = {"0": "HUMAN", "1": "AI"}
    else:
        # Fallback: download and export on first run
        _export_if_needed()
        return load_model()

    return _session


def _export_if_needed():
    """Auto-export ONNX model if not present."""
    from backend.analysis.export_onnx import export
    export()


def is_model_loaded() -> bool:
    return _session is not None


def _softmax(logits):
    exp = np.exp(logits - np.max(logits, axis=-1, keepdims=True))
    return exp / exp.sum(axis=-1, keepdims=True)


def _classify(text: str) -> dict:
    """Classify a single text. Returns {label, score}."""
    load_model()

    inputs = _tokenizer(
        text,
        return_tensors="np",
        padding=True,
        truncation=True,
        max_length=512,
    )

    ort_inputs = {
        "input_ids": inputs["input_ids"].astype(np.int64),
        "attention_mask": inputs["attention_mask"].astype(np.int64),
    }

    logits = _session.run(None, ort_inputs)[0]
    probs = _softmax(logits)[0]

    predicted_idx = int(np.argmax(probs))
    label = _label_map.get(str(predicted_idx), "HUMAN")
    confidence = float(probs[predicted_idx])

    return {"label": label, "score": confidence}


def _chunk_text(text: str, max_tokens: int = 450) -> list[str]:
    """Split text into chunks that fit within the model's token limit."""
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
    load_model()
    chunks = _chunk_text(text)

    if len(chunks) == 1:
        result = _classify(chunks[0])
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

    for chunk in chunks:
        result = _classify(chunk)
        label = result["label"]
        confidence = result["score"]
        chunk_ml_score = confidence if label.upper() == "AI" else 1 - confidence
        weight = confidence
        weighted_score += chunk_ml_score * weight
        total_weight += weight

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
    load_model()
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
            result = _classify(sentence)
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
