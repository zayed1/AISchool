import time
import hashlib
import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

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


# #16 — URL content extraction endpoint
class FetchUrlRequest(BaseModel):
    url: str


class FetchUrlResponse(BaseModel):
    text: str


@router.post("/fetch-url", response_model=FetchUrlResponse)
async def fetch_url_content(request: FetchUrlRequest):
    import httpx

    url = request.url.strip()
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="رابط غير صالح")

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            response.raise_for_status()
            html = response.text

        # Strip HTML tags and extract text
        text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
        text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
        text = re.sub(r'<[^>]+>', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()

        if len(text) < 50:
            raise HTTPException(status_code=400, detail="لم يتم العثور على نص كافٍ في هذا الرابط")

        return FetchUrlResponse(text=text)
    except httpx.HTTPError:
        raise HTTPException(status_code=400, detail="تعذر الوصول إلى الرابط")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="حدث خطأ أثناء استخراج النص")
