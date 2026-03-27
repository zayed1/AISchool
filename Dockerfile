# --- Stage 1: Build frontend ---
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# --- Stage 2: Export ML models to ONNX ---
FROM python:3.11-slim AS model-export
WORKDIR /export
RUN pip install --no-cache-dir torch==2.5.* transformers==4.48.* onnxruntime==1.21.* onnx "numpy<2"
COPY backend/analysis/export_onnx.py ./export_onnx.py
ENV ONNX_OUTPUT_DIR=/export
RUN python export_onnx.py
RUN ls -lh /export/onnx_model/model.onnx && echo "Primary model verified!"
RUN ls -lh /export/onnx_model2/model.onnx && echo "Secondary model verified!" || echo "Secondary model not available (optional)"

# --- Stage 3: Final lightweight image ---
FROM python:3.11-slim
WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/

# Copy both ONNX models
COPY --from=model-export /export/onnx_model/ ./backend/analysis/onnx_model/
COPY --from=model-export /export/onnx_model2/ ./backend/analysis/onnx_model2/

RUN ls -lh ./backend/analysis/onnx_model/model.onnx && echo "Primary model in image!"

COPY --from=frontend-build /app/dist ./static/

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port $PORT"]
