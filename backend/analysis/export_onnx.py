"""Export HuggingFace model to ONNX format for lightweight inference."""
import os
import json

MODEL_NAME = "sabaridsnfuji/arabic-ai-text-detector"
# When run from Dockerfile, output to ./onnx_model; when run locally, output next to this file
OUTPUT_DIR = os.environ.get("ONNX_OUTPUT_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "onnx_model"))


def export():
    import torch
    from transformers import AutoTokenizer, AutoModelForSequenceClassification

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"Loading model: {MODEL_NAME}")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
    model.eval()

    # Save tokenizer
    tokenizer.save_pretrained(OUTPUT_DIR)

    # Save label mapping
    config = model.config
    label_map = config.id2label if hasattr(config, "id2label") else {0: "HUMAN", 1: "AI"}
    with open(os.path.join(OUTPUT_DIR, "label_map.json"), "w") as f:
        json.dump({str(k): v for k, v in label_map.items()}, f)

    # Create dummy input
    dummy = tokenizer("هذا نص تجريبي", return_tensors="pt", padding="max_length", truncation=True, max_length=512)

    # Export to ONNX
    onnx_path = os.path.join(OUTPUT_DIR, "model.onnx")
    print(f"Exporting to ONNX: {onnx_path}")

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
    print(f"Max difference PyTorch vs ONNX: {diff:.6f}")

    model_size = os.path.getsize(onnx_path) / (1024 * 1024)
    print(f"ONNX model size: {model_size:.1f} MB")
    print("Export successful!")


if __name__ == "__main__":
    export()
