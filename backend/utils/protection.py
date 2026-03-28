# Advanced bot protection and rate limiting middleware
import time
import hashlib
from collections import defaultdict
from fastapi import Request, HTTPException
from backend.utils.logging import get_logger

log = get_logger("protection")

# --- Rate limiting with sliding window ---
_rate_store: dict[str, list[float]] = {}
_RATE_LIMIT_MINUTE = 20       # max requests per minute per IP
_RATE_LIMIT_HOUR = 120        # max requests per hour per IP
_RATE_LIMIT_ANALYZE = 10      # max analyze calls per minute per IP

# --- Bot fingerprint tracking ---
_suspicious_ips: dict[str, dict] = {}  # ip -> {score, last_seen, blocked_until}
_BLOCK_DURATION = 300          # 5 minutes block for detected bots
_SUSPICIOUS_THRESHOLD = 8     # score threshold to block

# --- Request speed tracking ---
_last_request: dict[str, float] = {}  # ip -> timestamp of last request

# --- Cleanup ---
_last_cleanup = time.time()
_CLEANUP_INTERVAL = 300  # cleanup every 5 minutes


def _get_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _cleanup():
    """Periodically clean old entries to prevent memory leak."""
    global _last_cleanup
    now = time.time()
    if now - _last_cleanup < _CLEANUP_INTERVAL:
        return
    _last_cleanup = now

    # Clean rate store
    for ip in list(_rate_store.keys()):
        _rate_store[ip] = [t for t in _rate_store[ip] if now - t < 3600]
        if not _rate_store[ip]:
            del _rate_store[ip]

    # Clean expired blocks
    for ip in list(_suspicious_ips.keys()):
        if _suspicious_ips[ip].get("blocked_until", 0) < now and now - _suspicious_ips[ip].get("last_seen", 0) > 3600:
            del _suspicious_ips[ip]

    # Clean old last_request entries
    for ip in list(_last_request.keys()):
        if now - _last_request[ip] > 3600:
            del _last_request[ip]


def _check_bot_signals(request: Request, ip: str) -> int:
    """Score suspicious signals. Higher = more likely bot."""
    score = 0

    # 1. Missing or suspicious User-Agent
    ua = request.headers.get("user-agent", "")
    if not ua:
        score += 3
    elif len(ua) < 20:
        score += 2
    elif any(bot in ua.lower() for bot in ["bot", "crawler", "spider", "curl", "wget", "python-requests", "scrapy", "httpx"]):
        score += 4

    # 2. Missing common browser headers
    if not request.headers.get("accept-language"):
        score += 1
    if not request.headers.get("accept"):
        score += 1

    # 3. Too fast (< 500ms between requests)
    now = time.time()
    last = _last_request.get(ip, 0)
    if last and now - last < 0.5:
        score += 2
    if last and now - last < 0.1:
        score += 3  # extremely fast = definitely automated

    _last_request[ip] = now

    # 4. No referer on API calls (bots often skip this)
    if not request.headers.get("referer"):
        score += 1

    return score


def check_protection(request: Request, is_analyze: bool = False):
    """Main protection check — call on every request."""
    _cleanup()
    ip = _get_ip(request)
    now = time.time()

    # 1. Check if IP is blocked
    sus = _suspicious_ips.get(ip, {})
    if sus.get("blocked_until", 0) > now:
        remaining = int(sus["blocked_until"] - now)
        log.warning(f"Blocked IP {ip} tried to access (remaining: {remaining}s)")
        raise HTTPException(status_code=429, detail=f"تم حظرك مؤقتاً لسلوك مشبوه. حاول بعد {remaining} ثانية.")

    # 2. Bot detection
    bot_score = _check_bot_signals(request, ip)
    if ip in _suspicious_ips:
        _suspicious_ips[ip]["score"] = min(20, _suspicious_ips[ip]["score"] + bot_score)
        _suspicious_ips[ip]["last_seen"] = now
    elif bot_score >= 3:
        _suspicious_ips[ip] = {"score": bot_score, "last_seen": now, "blocked_until": 0}

    if _suspicious_ips.get(ip, {}).get("score", 0) >= _SUSPICIOUS_THRESHOLD:
        _suspicious_ips[ip]["blocked_until"] = now + _BLOCK_DURATION
        _suspicious_ips[ip]["score"] = 0  # reset after block
        log.warning(f"Bot detected and blocked: {ip} (score: {bot_score})")
        raise HTTPException(status_code=429, detail="تم اكتشاف نشاط آلي. تم حظرك مؤقتاً.")

    # 3. Rate limiting
    hits = _rate_store.get(ip, [])
    hits = [t for t in hits if now - t < 3600]  # keep last hour

    # Per-minute check
    hits_minute = [t for t in hits if now - t < 60]
    if len(hits_minute) >= _RATE_LIMIT_MINUTE:
        log.warning(f"Rate limit (minute) exceeded for {ip}: {len(hits_minute)}")
        raise HTTPException(status_code=429, detail="طلبات كثيرة. انتظر دقيقة.")

    # Per-hour check
    if len(hits) >= _RATE_LIMIT_HOUR:
        log.warning(f"Rate limit (hour) exceeded for {ip}: {len(hits)}")
        raise HTTPException(status_code=429, detail="تجاوزت الحد الساعي. حاول لاحقاً.")

    # Analyze-specific limit (stricter)
    if is_analyze:
        analyze_hits = [t for t in hits_minute if True]  # all minute hits count
        if len(analyze_hits) >= _RATE_LIMIT_ANALYZE:
            raise HTTPException(status_code=429, detail="تحليلات كثيرة. انتظر قليلاً.")

    # Record hit
    hits.append(now)
    _rate_store[ip] = hits


def get_protection_stats() -> dict:
    """Get current protection statistics."""
    now = time.time()
    active_blocks = sum(1 for s in _suspicious_ips.values() if s.get("blocked_until", 0) > now)
    return {
        "tracked_ips": len(_rate_store),
        "suspicious_ips": len(_suspicious_ips),
        "active_blocks": active_blocks,
        "rate_limit_minute": _RATE_LIMIT_MINUTE,
        "rate_limit_hour": _RATE_LIMIT_HOUR,
    }
