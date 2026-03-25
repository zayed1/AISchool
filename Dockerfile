# --- Stage 1: Build frontend ---
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# --- Stage 2: Export ML model to ONNX (temporary, not in final image) ---
FROM python:3.11-slim AS model-export
WORKDIR /export
RUN pip install --no-cache-dir torch==2.5.* transformers==4.48.* onnxruntime==1.21.* onnx "numpy<2"
COPY backend/analysis/export_onnx.py ./export_onnx.py
ENV ONNX_OUTPUT_DIR=/export/onnx_model
RUN python export_onnx.py
# Verify the ONNX model was actually exported
RUN ls -lh /export/onnx_model/model.onnx && echo "ONNX export verified!"

# --- Stage 3: Final lightweight image (no PyTorch!) ---
FROM python:3.11-slim
WORKDIR /app

# Install production dependencies (no torch — only ~200MB instead of ~2.5GB)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy exported ONNX model from build stage
COPY --from=model-export /export/onnx_model/ ./backend/analysis/onnx_model/

# Verify ONNX model is in final image
RUN ls -lh ./backend/analysis/onnx_model/model.onnx && echo "ONNX model present in final image!"

# Copy built frontend
COPY --from=frontend-build /app/dist ./static/

# Railway sets PORT env var — app must listen on it
ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port $PORT"]
