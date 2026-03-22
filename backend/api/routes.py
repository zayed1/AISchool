import time
import hashlib

from fastapi import APIRouter, HTTPException

from backend.api.schemas import AnalyzeRequest, AnalyzeResponse, HealthResponse
from backend.analysis.statistical import analyze as statistical_analyze, split_sentences
from backend.analysis.ml_model import predict, predict_sentences, is_model_loaded
from backend.analysis.combiner import combine_scores
from backend.db.supabase_client import save_scan

router = APIRouter(prefix="/api")


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_text(request: AnalyzeRequest):
    start_time = time.time()

    text = request.text.strip()
    words = text.split()

    stat_result = statistical_analyze(text)
    ml_result = predict(text)
    combined = combine_scores(stat_result["statistical_score"], ml_result["ml_score"])

    sentences = split_sentences(text)
    sentence_results = predict_sentences(sentences)

    elapsed_ms = int((time.time() - start_time) * 1000)

    text_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
    try:
        save_scan(
            text_hash=text_hash,
            word_count=len(words),
            final_score=combined["final_score"],
            statistical_score=stat_result["statistical_score"],
            ml_score=ml_result["ml_score"],
        )
    except Exception:
        pass

    return AnalyzeResponse(
        result=combined,
        statistical=stat_result,
        ml=ml_result,
        sentences=sentence_results,
        metadata={
            "word_count": len(words),
            "sentence_count": len(sentences),
            "analysis_time_ms": elapsed_ms,
        },
    )


@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        model_loaded=is_model_loaded(),
    )
