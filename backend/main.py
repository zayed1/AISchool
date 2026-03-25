import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.config import ALLOWED_ORIGINS
from backend.analysis.ml_model import load_model
from backend.api.routes import router

# #20 — Global stats tracking
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

    try:
        load_model()
    except Exception as e:
        print(f"[FATAL] Failed to load ML model: {e}", flush=True)
        raise

    # #15 — Warm cache: run a test prediction to warm up the model
    try:
        from backend.analysis.statistical import analyze as stat_analyze
        from backend.analysis.ml_model import predict
        test_text = "هذا نص تجريبي لتسخين النموذج " * 10
        stat_analyze(test_text)
        predict(test_text)
        print("[INFO] Model warm-up complete", flush=True)
    except Exception as e:
        print(f"[WARN] Model warm-up failed: {e}", flush=True)

    yield


app = FastAPI(
    title="كاشف النصوص العربية المولدة بالذكاء الاصطناعي",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

# Serve frontend static files in production (Railway single-service deploy)
_static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
if os.path.isdir(_static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(_static_dir, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve frontend SPA — all non-API routes return index.html."""
        file_path = os.path.join(_static_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(_static_dir, "index.html"))
