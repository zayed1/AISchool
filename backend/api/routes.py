import time
import json
import hashlib
import re
import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.api.schemas import AnalyzeRequest, AnalyzeResponse, HealthResponse
from backend.analysis.statistical import analyze as statistical_analyze, split_sentences
from backend.analysis.ml_model import predict, predict_sentences, is_model_loaded
from backend.analysis.combiner import combine_scores
from backend.db.supabase_client import save_scan, get_client

router = APIRouter(prefix="/api")


def _get_stats():
    from backend.main import get_stats
    return get_stats()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_text(request: AnalyzeRequest):
    start_time = time.time()
    stats = _get_stats()

    text = request.text.strip()
    words = text.split()

    stat_result = statistical_analyze(text)
    ml_result = predict(text)
    # #1 — Dynamic weights based on word count
    combined = combine_scores(
        stat_result["statistical_score"],
        ml_result["ml_score"],
        word_count=len(words),
    )

    sentences = split_sentences(text)
    sentence_results = predict_sentences(sentences)

    elapsed_ms = int((time.time() - start_time) * 1000)

    # Track stats
    stats["total_analyses"] += 1
    stats["total_analysis_ms"] += elapsed_ms

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

    # #9 — Reliability score in metadata
    arabic_chars = len(re.findall(r'[\u0600-\u06FF]', text))
    all_alpha = len(re.findall(r'[a-zA-Z\u0600-\u06FF]', text))
    arabic_ratio = arabic_chars / all_alpha if all_alpha > 0 else 0

    reliability = _calc_reliability(
        word_count=len(words),
        arabic_ratio=arabic_ratio,
        ml_stat_agreement=abs(ml_result["ml_score"] - stat_result["statistical_score"]),
        sentence_count=len(sentences),
    )

    return AnalyzeResponse(
        result=combined,
        statistical=stat_result,
        ml=ml_result,
        sentences=sentence_results,
        metadata={
            "word_count": len(words),
            "sentence_count": len(sentences),
            "analysis_time_ms": elapsed_ms,
            "reliability": reliability,
            "arabic_ratio": round(arabic_ratio, 2),
        },
    )


# #9 — Reliability score calculator
def _calc_reliability(word_count: int, arabic_ratio: float, ml_stat_agreement: float, sentence_count: int) -> dict:
    score = 0.0
    factors = []

    # Word count contribution (max 30)
    if word_count >= 300:
        score += 30
    elif word_count >= 150:
        score += 25
    elif word_count >= 100:
        score += 20
    else:
        score += 10
        factors.append("نص قصير — الدقة أقل")

    # Arabic ratio (max 25)
    if arabic_ratio >= 0.9:
        score += 25
    elif arabic_ratio >= 0.7:
        score += 20
    else:
        score += 10
        factors.append("نسبة النص العربي منخفضة")

    # ML-Statistical agreement (max 25)
    if ml_stat_agreement <= 0.1:
        score += 25
    elif ml_stat_agreement <= 0.2:
        score += 20
    elif ml_stat_agreement <= 0.3:
        score += 15
    else:
        score += 5
        factors.append("تباين بين التحليل الإحصائي والنموذج")

    # Sentence count (max 20)
    if sentence_count >= 10:
        score += 20
    elif sentence_count >= 5:
        score += 15
    else:
        score += 8
        factors.append("عدد الجمل قليل")

    level = "عالية" if score >= 80 else "متوسطة" if score >= 60 else "منخفضة"

    return {
        "score": round(score),
        "level": level,
        "factors": factors,
    }


# SSE streaming analysis endpoint
@router.post("/analyze-stream")
async def analyze_text_stream(request: AnalyzeRequest):
    import asyncio

    text = request.text.strip()
    words = text.split()
    stats = _get_stats()

    async def event_stream():
        start_time = time.time()

        yield f"data: {json.dumps({'step': 'statistical', 'message': 'جارٍ التحليل الإحصائي...'})}\n\n"
        stat_result = statistical_analyze(text)
        await asyncio.sleep(0.1)

        yield f"data: {json.dumps({'step': 'ml', 'message': 'جارٍ تحليل النموذج...'})}\n\n"
        ml_result = predict(text)
        await asyncio.sleep(0.1)

        yield f"data: {json.dumps({'step': 'sentences', 'message': 'جارٍ تحليل الجمل...'})}\n\n"
        sentences = split_sentences(text)
        sentence_results = predict_sentences(sentences)
        await asyncio.sleep(0.1)

        yield f"data: {json.dumps({'step': 'combining', 'message': 'جارٍ دمج النتائج...'})}\n\n"
        combined = combine_scores(stat_result["statistical_score"], ml_result["ml_score"], word_count=len(words))

        elapsed_ms = int((time.time() - start_time) * 1000)
        stats["total_analyses"] += 1
        stats["total_analysis_ms"] += elapsed_ms

        text_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
        try:
            save_scan(text_hash=text_hash, word_count=len(words), final_score=combined["final_score"],
                      statistical_score=stat_result["statistical_score"], ml_score=ml_result["ml_score"])
        except Exception:
            pass

        arabic_chars = len(re.findall(r'[\u0600-\u06FF]', text))
        all_alpha = len(re.findall(r'[a-zA-Z\u0600-\u06FF]', text))
        arabic_ratio = arabic_chars / all_alpha if all_alpha > 0 else 0
        reliability = _calc_reliability(len(words), arabic_ratio, abs(ml_result["ml_score"] - stat_result["statistical_score"]), len(sentences))

        final_data = {
            "step": "done",
            "result": combined,
            "statistical": stat_result,
            "ml": ml_result,
            "sentences": sentence_results,
            "metadata": {
                "word_count": len(words),
                "sentence_count": len(sentences),
                "analysis_time_ms": elapsed_ms,
                "reliability": reliability,
                "arabic_ratio": round(arabic_ratio, 2),
            },
        }
        yield f"data: {json.dumps(final_data)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# #20 — Advanced healthcheck
@router.get("/health", response_model=HealthResponse)
async def health_check():
    import psutil
    stats = _get_stats()
    uptime = time.time() - stats["start_time"] if stats["start_time"] > 0 else 0
    avg_ms = stats["total_analysis_ms"] / stats["total_analyses"] if stats["total_analyses"] > 0 else 0

    try:
        process = psutil.Process(os.getpid())
        memory_mb = process.memory_info().rss / 1024 / 1024
    except Exception:
        memory_mb = 0

    return HealthResponse(
        status="healthy",
        model_loaded=is_model_loaded(),
        uptime_seconds=round(uptime, 1),
        total_analyses=stats["total_analyses"],
        avg_analysis_ms=round(avg_ms, 1),
        memory_mb=round(memory_mb, 1),
    )


# #17 — Admin stats endpoint
class AdminStatsResponse(BaseModel):
    total_scans: int = 0
    avg_score: float = 0
    ai_count: int = 0
    human_count: int = 0
    avg_word_count: float = 0
    recent_scans: list = []


@router.get("/admin/stats", response_model=AdminStatsResponse)
async def admin_stats():
    """Fetch stats from Supabase if available, else from in-memory."""
    client = get_client()
    if client is None:
        # Return in-memory stats
        stats = _get_stats()
        return AdminStatsResponse(total_scans=stats["total_analyses"])

    try:
        result = client.table("scans").select("*").order("created_at", desc=True).limit(100).execute()
        scans = result.data if result.data else []

        total = len(scans)
        if total == 0:
            return AdminStatsResponse()

        avg_score = sum(s.get("final_score", 0) for s in scans) / total
        ai_count = sum(1 for s in scans if s.get("final_score", 0) >= 0.5)
        human_count = total - ai_count
        avg_words = sum(s.get("word_count", 0) for s in scans) / total

        recent = [
            {
                "score": s.get("final_score", 0),
                "words": s.get("word_count", 0),
                "date": s.get("created_at", ""),
            }
            for s in scans[:10]
        ]

        return AdminStatsResponse(
            total_scans=total,
            avg_score=round(avg_score, 2),
            ai_count=ai_count,
            human_count=human_count,
            avg_word_count=round(avg_words),
            recent_scans=recent,
        )
    except Exception:
        return AdminStatsResponse()


# #18 — Admin data export
@router.get("/admin/export")
async def admin_export():
    client = get_client()
    if client is None:
        return {"data": [], "message": "لا توجد قاعدة بيانات متصلة"}

    try:
        result = client.table("scans").select("*").order("created_at", desc=True).limit(1000).execute()
        return {"data": result.data or [], "count": len(result.data or [])}
    except Exception:
        raise HTTPException(status_code=500, detail="فشل في تصدير البيانات")


# URL content extraction endpoint
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
