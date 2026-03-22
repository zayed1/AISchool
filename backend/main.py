import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

    load_model()

    # #15 — Warm cache: run a test prediction to warm up the model
    try:
        from backend.analysis.statistical import analyze as stat_analyze
        from backend.analysis.ml_model import predict
        test_text = "هذا نص تجريبي لتسخين النموذج " * 10
        stat_analyze(test_text)
        predict(test_text)
    except Exception:
        pass

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
