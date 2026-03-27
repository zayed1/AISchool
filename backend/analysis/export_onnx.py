"""Export ML models to ONNX format — full FP32 precision for maximum accuracy."""
import os
import json

MODELS = [
    {
        "name": os.environ.get("MODEL_NAME", "sabaridsnfuji/arabic-ai-text-detector"),
        "output_subdir": "onnx_model",
    },
    {
        "name": os.environ.get("MODEL2_NAME", "yaya36095/xlm-roberta-text-detector"),
        "output_subdir": "onnx_model2",
    },
]

BASE_OUTPUT = os.environ.get("ONNX_OUTPUT_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), ""))


def export_single(model_name: str, output_dir: str):
    import torch
    from transformers import AutoTokenizer, AutoModelForSequenceClassification

    os.makedirs(output_dir, exist_ok=True)

    print(f"Loading model: {model_name}")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name)
    model.eval()

    tokenizer.save_pretrained(output_dir)

    config = model.config
    label_map = config.id2label if hasattr(config, "id2label") else {0: "HUMAN", 1: "AI"}
    with open(os.path.join(output_dir, "label_map.json"), "w") as f:
        json.dump({str(k): v for k, v in label_map.items()}, f)

    dummy = tokenizer("هذا نص تجريبي للتصدير", return_tensors="pt", padding="max_length", truncation=True, max_length=512)

    onnx_path = os.path.join(output_dir, "model.onnx")
    print(f"Exporting to ONNX (FP32): {onnx_path}")

    torch.onnx.export(
        model,
        (dummy["input_ids"], dummy["attention_mask"]),
        onnx_path,
        input_names=["input_ids", "attention_mask"],
        output_names=["logits"],
        dynamic_axes={
            "input_ids": {0: "batch", 1: "seq"},
            "attention_mask": {0: "batch", 1: "seq"},
            "logits": {0: "batch"},
        },
        opset_version=14,
    )

    # Verify
    import onnxruntime as ort
    import numpy as np
    session = ort.InferenceSession(onnx_path)
    ort_inputs = {
        "input_ids": dummy["input_ids"].numpy(),
        "attention_mask": dummy["attention_mask"].numpy(),
    }
    ort_out = session.run(None, ort_inputs)

    with torch.no_grad():
        pt_out = model(dummy["input_ids"], dummy["attention_mask"])
    pt_logits = pt_out.logits.numpy()
    diff = abs(pt_logits - ort_out[0]).max()

    model_size = os.path.getsize(onnx_path) / (1024 * 1024)
    print(f"  Max diff: {diff:.6f} | Size: {model_size:.1f} MB")
    print(f"  Labels: {label_map}")


def export():
    for m in MODELS:
        output_dir = os.path.join(BASE_OUTPUT, m["output_subdir"])
        try:
            export_single(m["name"], output_dir)
            print(f"✓ {m['name']} exported successfully")
        except Exception as e:
            print(f"✗ {m['name']} failed: {e}")
            # Don't fail the whole build — primary model is required, secondary is optional
            if m["output_subdir"] == "onnx_model":
                raise

    print("\nAll exports complete!")


if __name__ == "__main__":
    export()
