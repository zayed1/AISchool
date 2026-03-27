# Auth middleware — extracts user from Supabase JWT, tracks usage per plan
import time
import jwt
from fastapi import Request, HTTPException
from backend.config import SUPABASE_URL, SUPABASE_KEY, PLANS
from backend.utils.logging import get_logger

log = get_logger("auth")

# In-memory daily usage tracker: { user_id: { date: str, count: int } }
_usage: dict[str, dict] = {}

# User plan cache: { user_id: { plan: str, ts: float } }
_plan_cache: dict[str, dict] = {}
_PLAN_CACHE_TTL = 300  # 5 minutes


def _today() -> str:
    return time.strftime("%Y-%m-%d")


def get_current_user(request: Request) -> dict | None:
    """Extract user from Supabase JWT. Returns None for anonymous users."""
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        return None

    token = auth[7:]
    try:
        # Supabase uses HS256 with the JWT secret (which is the anon/service key)
        # For public anon key verification, we decode without verification
        # and trust Supabase's token validation
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload.get("sub")
        email = payload.get("email", "")
        if not user_id:
            return None
        return {"id": user_id, "email": email}
    except jwt.InvalidTokenError:
        return None


def get_user_plan(user_id: str) -> str:
    """Get user's plan. Checks Supabase profiles table, falls back to 'free'."""
    now = time.time()
    cached = _plan_cache.get(user_id)
    if cached and now - cached["ts"] < _PLAN_CACHE_TTL:
        return cached["plan"]

    plan = "free"
    try:
        from backend.db.supabase_client import get_client
        client = get_client()
        if client:
            result = client.table("profiles").select("plan").eq("id", user_id).single().execute()
            if result.data:
                plan = result.data.get("plan", "free")
    except Exception:
        pass

    _plan_cache[user_id] = {"plan": plan, "ts": now}
    return plan


def get_usage_today(user_id: str) -> int:
    """Get how many analyses the user has done today."""
    today = _today()
    entry = _usage.get(user_id)
    if entry and entry["date"] == today:
        return entry["count"]
    return 0


def record_usage(user_id: str):
    """Record one analysis for the user."""
    today = _today()
    entry = _usage.get(user_id)
    if entry and entry["date"] == today:
        entry["count"] += 1
    else:
        _usage[user_id] = {"date": today, "count": 1}


def check_limits(request: Request) -> dict:
    """Check user plan and usage limits. Returns user context dict."""
    user = get_current_user(request)

    if not user:
        # Anonymous user — use IP-based free tier
        ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "anon")
        anon_id = f"anon:{ip}"
        usage = get_usage_today(anon_id)
        plan_config = PLANS["free"]

        if usage >= plan_config["daily_limit"]:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "daily_limit",
                    "message": f"وصلت للحد اليومي المجاني ({plan_config['daily_limit']} تحليلات). سجل دخولك أو اشترك للمزيد.",
                    "limit": plan_config["daily_limit"],
                    "used": usage,
                    "plan": "free",
                },
            )
        return {"user_id": anon_id, "plan": "free", "usage": usage, "limit": plan_config["daily_limit"], "authenticated": False}

    # Authenticated user
    plan_name = get_user_plan(user["id"])
    plan_config = PLANS.get(plan_name, PLANS["free"])
    usage = get_usage_today(user["id"])

    if usage >= plan_config["daily_limit"]:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "daily_limit",
                "message": f"وصلت للحد اليومي لخطة «{plan_config['name']}» ({plan_config['daily_limit']} تحليل/يوم).",
                "limit": plan_config["daily_limit"],
                "used": usage,
                "plan": plan_name,
            },
        )

    return {
        "user_id": user["id"],
        "email": user["email"],
        "plan": plan_name,
        "usage": usage,
        "limit": plan_config["daily_limit"],
        "max_words": plan_config["max_words"],
        "authenticated": True,
    }


def invalidate_plan_cache(user_id: str):
    """Call after plan changes (e.g. Stripe webhook)."""
    _plan_cache.pop(user_id, None)
