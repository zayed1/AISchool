# --- Stage 1: Build frontend ---
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# --- Stage 2: Backend + serve frontend ---
FROM python:3.11-slim
WORKDIR /app

# Install backend dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the ML model during build
RUN python -c "from transformers import pipeline; pipeline('text-classification', model='sabaridsnfuji/arabic-ai-text-detector')"

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend into static directory
COPY --from=frontend-build /app/dist ./static/

# Start server from root so imports work
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
