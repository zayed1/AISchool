import time
import json
import hashlib
import re
import os
import ipaddress
from urllib.parse import urlparse
from functools import wraps

from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.api.schemas import AnalyzeRequest, AnalyzeResponse, HealthResponse
from backend.analysis.statistical import analyze as statistical_analyze, split_sentences
from backend.analysis.ml_model import predict, predict_sentences, is_model_loaded
from backend.analysis.combiner import combine_scores
from backend.db.supabase_client import save_scan, get_client
from backend.utils.email_alerts import send_threshold_alert, is_email_configured
from backend.utils.cache import get_cached, set_cached, cache_stats
from backend.utils.logging import get_logger
from backend.config import ADMIN_API_KEY, PLANS
from backend.api.auth import check_limits, record_usage

log = get_logger("routes")
router = APIRouter(prefix="/api")


# --- B6: Simple in-memory rate limiter ---
_rate_store: dict[str, list[float]] = {}
_RATE_LIMIT = int(os.getenv("RATE_LIMIT", "30"))  # requests per window
_RATE_WINDOW = 60  # seconds


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _check_rate_limit(request: Request):
    ip = _get_client_ip(request)
    now = time.time()
    hits = _rate_store.get(ip, [])
    hits = [t for t in hits if now - t < _RATE_WINDOW]
    if len(hits) >= _RATE_LIMIT:
        log.warning(f"Rate limit exceeded for {ip}")
        raise HTTPException(status_code=429, detail=f"تم تجاوز الحد الأقصى ({_RATE_LIMIT} طلب/دقيقة). حاول بعد قليل.")
    hits.append(now)
    _rate_store[ip] = hits


# --- B7: Admin API key authentication ---
def _require_admin(request: Request):
    if not ADMIN_API_KEY:
        return  # No key configured = open access (dev mode)
    key = request.headers.get("x-admin-key") or request.query_params.get("key")
    if key != ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="مفتاح API غير صالح")


def _get_stats():
    from backend.main import get_stats
    return get_stats()


# --- B9: Reliability calculator ---
def _calc_reliability(word_count: int, arabic_ratio: float, ml_stat_agreement: float, sentence_count: int) -> dict:
    score = 0.0
    factors = []

    if word_count >= 300:
        score += 30
    elif word_count >= 150:
        score += 25
    elif word_count >= 100:
        score += 20
    else:
        score += 10
        factors.append("نص قصير — الدقة أقل")

    if arabic_ratio >= 0.9:
        score += 25
    elif arabic_ratio >= 0.7:
        score += 20
    else:
        score += 10
        factors.append("نسبة النص العربي منخفضة")

    if ml_stat_agreement <= 0.1:
        score += 25
    elif ml_stat_agreement <= 0.2:
        score += 20
    elif ml_stat_agreement <= 0.3:
        score += 15
    else:
        score += 5
        factors.append("تباين بين التحليل الإحصائي والنموذج")

    if sentence_count >= 10:
        score += 20
    elif sentence_count >= 5:
        score += 15
    else:
        score += 8
        factors.append("عدد الجمل قليل")

    level = "عالية" if score >= 80 else "متوسطة" if score >= 60 else "منخفضة"
    return {"score": round(score), "level": level, "factors": factors}


def _build_metadata(words, sentences, elapsed_ms, text, stat_result, ml_result):
    arabic_chars = len(re.findall(r'[\u0600-\u06FF]', text))
    all_alpha = len(re.findall(r'[a-zA-Z\u0600-\u06FF]', text))
    arabic_ratio = arabic_chars / all_alpha if all_alpha > 0 else 0
    reliability = _calc_reliability(
        word_count=len(words),
        arabic_ratio=arabic_ratio,
        ml_stat_agreement=abs(ml_result["ml_score"] - stat_result["statistical_score"]),
        sentence_count=len(sentences),
    )
    return {
        "word_count": len(words),
        "sentence_count": len(sentences),
        "analysis_time_ms": elapsed_ms,
        "reliability": reliability,
        "arabic_ratio": round(arabic_ratio, 2),
    }


# ====== ANALYSIS ENDPOINTS ======

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_text(request: AnalyzeRequest, req: Request):
    _check_rate_limit(req)

    # Check user plan limits
    user_ctx = check_limits(req)
    text = request.text.strip()
    words = text.split()

    # Enforce word limit based on plan
    plan_config = PLANS.get(user_ctx["plan"], PLANS["free"])
    if len(words) > plan_config["max_words"]:
        raise HTTPException(
            status_code=403,
            detail=f"خطتك ({plan_config['name']}) تسمح بحد أقصى {plan_config['max_words']} كلمة. النص يحتوي على {len(words)} كلمة.",
        )

    start_time = time.time()
    stats = _get_stats()

    # B1 — Check cache first
    cached = get_cached(text)
    if cached:
        record_usage(user_ctx["user_id"])
        log.info(f"Cache hit for text ({len(words)} words)")
        return AnalyzeResponse(**cached)
    stat_result = statistical_analyze(text)
    ml_result = predict(text)
    combined = combine_scores(stat_result["statistical_score"], ml_result["ml_score"], word_count=len(words))

    sentences = split_sentences(text)
    sentence_results = predict_sentences(sentences)

    elapsed_ms = int((time.time() - start_time) * 1000)
    stats["total_analyses"] += 1
    stats["total_analysis_ms"] += elapsed_ms

    # B12 — Log database errors instead of silent pass
    text_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
    try:
        save_scan(text_hash=text_hash, word_count=len(words), final_score=combined["final_score"],
                  statistical_score=stat_result["statistical_score"], ml_score=ml_result["ml_score"])
    except Exception as e:
        log.warning(f"DB write failed: {e}")

    metadata = _build_metadata(words, sentences, elapsed_ms, text, stat_result, ml_result)

    response_data = {
        "result": combined,
        "statistical": stat_result,
        "ml": ml_result,
        "sentences": sentence_results,
        "metadata": metadata,
    }

    # B1 — Store in cache
    set_cached(text, response_data)
    record_usage(user_ctx["user_id"])
    log.info(f"Analysis complete: {len(words)}w, {elapsed_ms}ms, score={combined['percentage']}%")

    return AnalyzeResponse(**response_data)


# B3 — SSE streaming (removed artificial delays)
@router.post("/analyze-stream")
async def analyze_text_stream(request: AnalyzeRequest, req: Request):
    _check_rate_limit(req)
    user_ctx = check_limits(req)
    text = request.text.strip()
    words = text.split()

    plan_config = PLANS.get(user_ctx["plan"], PLANS["free"])
    if len(words) > plan_config["max_words"]:
        raise HTTPException(
            status_code=403,
            detail=f"خطتك ({plan_config['name']}) تسمح بحد أقصى {plan_config['max_words']} كلمة.",
        )

    stats = _get_stats()
    cached = get_cached(text)

    async def event_stream():
        start_time = time.time()

        if cached:
            record_usage(user_ctx["user_id"])
            yield f"data: {json.dumps({'step': 'statistical', 'message': 'نتيجة محفوظة'})}\n\n"
            yield f"data: {json.dumps({'step': 'done', **cached})}\n\n"
            return

        yield f"data: {json.dumps({'step': 'statistical', 'message': 'جارٍ التحليل الإحصائي...'})}\n\n"
        stat_result = statistical_analyze(text)

        yield f"data: {json.dumps({'step': 'ml', 'message': 'جارٍ تحليل النموذج...'})}\n\n"
        ml_result = predict(text)

        yield f"data: {json.dumps({'step': 'sentences', 'message': 'جارٍ تحليل الجمل...'})}\n\n"
        sentences = split_sentences(text)
        sentence_results = predict_sentences(sentences)

        yield f"data: {json.dumps({'step': 'combining', 'message': 'جارٍ دمج النتائج...'})}\n\n"
        combined = combine_scores(stat_result["statistical_score"], ml_result["ml_score"], word_count=len(words))

        elapsed_ms = int((time.time() - start_time) * 1000)
        stats["total_analyses"] += 1
        stats["total_analysis_ms"] += elapsed_ms

        text_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
        try:
            save_scan(text_hash=text_hash, word_count=len(words), final_score=combined["final_score"],
                      statistical_score=stat_result["statistical_score"], ml_score=ml_result["ml_score"])
        except Exception as e:
            log.warning(f"DB write failed (stream): {e}")

        metadata = _build_metadata(words, sentences, elapsed_ms, text, stat_result, ml_result)

        final_data = {
            "step": "done",
            "result": combined,
            "statistical": stat_result,
            "ml": ml_result,
            "sentences": sentence_results,
            "metadata": metadata,
        }

        # B1 — Cache the result
        cache_data = {k: v for k, v in final_data.items() if k != "step"}
        set_cached(text, cache_data)
        record_usage(user_ctx["user_id"])

        yield f"data: {json.dumps(final_data)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ====== HEALTH ENDPOINTS ======

# B19 — Lightweight ping (for Railway healthcheck)
@router.get("/ping")
async def ping():
    return {"status": "ok"}


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


# ====== ADMIN ENDPOINTS (B7: protected) ======

# B5 — Cached admin stats
_admin_stats_cache = {"data": None, "ts": 0}
_ADMIN_CACHE_TTL = 60  # seconds


class AdminStatsResponse(BaseModel):
    total_scans: int = 0
    avg_score: float = 0
    ai_count: int = 0
    human_count: int = 0
    avg_word_count: float = 0
    recent_scans: list = []


@router.get("/admin/stats", response_model=AdminStatsResponse)
async def admin_stats(req: Request):
    _require_admin(req)

    # B5 — Return cached if fresh
    now = time.time()
    if _admin_stats_cache["data"] and now - _admin_stats_cache["ts"] < _ADMIN_CACHE_TTL:
        return _admin_stats_cache["data"]

    client = get_client()
    if client is None:
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
            {"score": s.get("final_score", 0), "words": s.get("word_count", 0), "date": s.get("created_at", "")}
            for s in scans[:10]
        ]

        if total >= 5 and ai_count / total > 0.6:
            send_threshold_alert(ai_count, total, avg_score)

        resp = AdminStatsResponse(
            total_scans=total, avg_score=round(avg_score, 2), ai_count=ai_count,
            human_count=human_count, avg_word_count=round(avg_words), recent_scans=recent,
        )

        # B5 — Update cache
        _admin_stats_cache["data"] = resp
        _admin_stats_cache["ts"] = now
        return resp

    except Exception as e:
        log.warning(f"Admin stats query failed: {e}")
        return AdminStatsResponse()


# B13 — Paginated export
@router.get("/admin/export")
async def admin_export(req: Request, page: int = 1, size: int = 100):
    _require_admin(req)
    client = get_client()
    if client is None:
        return {"data": [], "message": "لا توجد قاعدة بيانات متصلة"}

    size = min(size, 500)  # cap page size
    offset = (page - 1) * size

    try:
        result = client.table("scans").select("*").order("created_at", desc=True).range(offset, offset + size - 1).execute()
        return {"data": result.data or [], "count": len(result.data or []), "page": page, "size": size}
    except Exception as e:
        log.error(f"Admin export failed: {e}")
        raise HTTPException(status_code=500, detail="فشل في تصدير البيانات")


class EmailConfigResponse(BaseModel):
    configured: bool
    admin_email: str = ""


@router.get("/admin/email-status", response_model=EmailConfigResponse)
async def email_status(req: Request):
    _require_admin(req)
    return EmailConfigResponse(
        configured=is_email_configured(),
        admin_email=os.getenv("ADMIN_EMAIL", "")[:3] + "***" if os.getenv("ADMIN_EMAIL") else "",
    )


@router.post("/admin/test-email")
async def test_email(req: Request):
    _require_admin(req)
    if not is_email_configured():
        raise HTTPException(status_code=400, detail="البريد الإلكتروني غير مُعدّ")
    send_threshold_alert(ai_count=5, total_count=10, avg_score=0.72)
    return {"message": "تم إرسال بريد تجريبي"}


# B5 — Cache stats endpoint
@router.get("/admin/cache")
async def admin_cache_stats(req: Request):
    _require_admin(req)
    return cache_stats()


# ====== URL EXTRACTION (B8: SSRF protection, B10: sanitization) ======

# B8 — Block private/internal IPs
_BLOCKED_NETWORKS = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
]


def _is_private_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname
        if not hostname:
            return True
        # Block common internal hostnames
        if hostname in ("localhost", "0.0.0.0", "metadata.google.internal"):
            return True
        import socket
        resolved = socket.getaddrinfo(hostname, None)
        for _, _, _, _, addr in resolved:
            ip = ipaddress.ip_address(addr[0])
            if any(ip in network for network in _BLOCKED_NETWORKS):
                return True
    except Exception:
        return True
    return False


class FetchUrlRequest(BaseModel):
    url: str


class FetchUrlResponse(BaseModel):
    text: str


@router.post("/fetch-url", response_model=FetchUrlResponse)
async def fetch_url_content(request: FetchUrlRequest, req: Request):
    _check_rate_limit(req)
    import httpx

    url = request.url.strip()
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="رابط غير صالح")

    # B8 — SSRF protection
    if _is_private_url(url):
        raise HTTPException(status_code=400, detail="رابط غير مسموح")

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, max_redirects=3) as client:
            response = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            response.raise_for_status()
            html = response.text

        # B10 — Thorough HTML sanitization
        text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'<nav[^>]*>.*?</nav>', '', text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'<footer[^>]*>.*?</footer>', '', text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'<header[^>]*>.*?</header>', '', text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
        text = re.sub(r'<[^>]+>', ' ', text)
        text = re.sub(r'&[a-zA-Z]+;', ' ', text)  # HTML entities
        text = re.sub(r'&#\d+;', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()

        if len(text) < 50:
            raise HTTPException(status_code=400, detail="لم يتم العثور على نص كافٍ في هذا الرابط")

        # Truncate to max 50000 chars
        text = text[:50000]

        return FetchUrlResponse(text=text)
    except httpx.HTTPError:
        raise HTTPException(status_code=400, detail="تعذر الوصول إلى الرابط")
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"URL fetch error: {e}")
        raise HTTPException(status_code=500, detail="حدث خطأ أثناء استخراج النص")
