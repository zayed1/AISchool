import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.utils.logging import get_logger

log = get_logger("main")

# Early diagnostics
log.info("Starting application...")
log.info(f"Python {sys.version}")
log.info(f"Working dir: {os.getcwd()}")

_onnx_check = os.path.join(os.path.dirname(os.path.abspath(__file__)), "analysis", "onnx_model", "model.onnx")
log.info(f"ONNX model exists: {os.path.isfile(_onnx_check)}")
if os.path.isdir(os.path.dirname(_onnx_check)):
    log.info(f"ONNX dir contents: {os.listdir(os.path.dirname(_onnx_check))}")

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

log.info("FastAPI imported OK")

from backend.config import ALLOWED_ORIGINS
from backend.analysis.ml_model import load_model, is_model_loaded
from backend.api.routes import router
from backend.api.billing import router as billing_router

log.info("All modules imported OK")

# Global stats tracking
_stats = {
    "start_time": 0,
    "total_analyses": 0,
    "total_analysis_ms": 0,
}


def get_stats():
    return _stats


@asynccontextmanager
async def lifespan(app: FastAPI):
    _stats["start_time"] = time.time()

    log.info("Loading ML model...")
    try:
        loaded = load_model()
        if loaded:
            log.info("ML model loaded successfully")
        else:
            log.warning("ML model unavailable — statistical-only mode")
    except Exception as e:
        log.warning(f"ML model load error: {e} — continuing in statistical-only mode")

    # Warm cache
    try:
        from backend.analysis.statistical import analyze as stat_analyze
        from backend.analysis.ml_model import predict
        test_text = "هذا نص تجريبي لتسخين النموذج " * 10
        stat_analyze(test_text)
        if is_model_loaded():
            predict(test_text)
        log.info("Warm-up complete")
    except Exception as e:
        log.warning(f"Warm-up failed: {e}")

    log.info("Application startup complete!")
    yield


app = FastAPI(
    title="كاشف النصوص العربية المولدة بالذكاء الاصطناعي",
    version="2.0.0",
    lifespan=lifespan,
)

# B9 — Tighter CORS: only allow needed methods/headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Admin-Key"],
)

app.include_router(router)
app.include_router(billing_router)

# Serve frontend static files in production
_static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
if os.path.isdir(_static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(_static_dir, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(_static_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(_static_dir, "index.html"))
