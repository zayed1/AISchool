# Billing routes — Stripe checkout + webhooks + subscription management
import os
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from backend.config import STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRO_PRICE_ID, APP_URL, PLANS
from backend.api.auth import get_current_user, get_user_plan, get_usage_today, invalidate_plan_cache
from backend.utils.logging import get_logger

log = get_logger("billing")
router = APIRouter(prefix="/api/billing")


def _get_stripe():
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="نظام الدفع غير مُعدّ")
    import stripe
    stripe.api_key = STRIPE_SECRET_KEY
    return stripe


# --- User profile / status ---
class UserStatusResponse(BaseModel):
    authenticated: bool
    plan: str = "free"
    plan_name: str = "مجاني"
    usage_today: int = 0
    daily_limit: int = 10
    max_words: int = 1000
    features: list[str] = []
    email: str = ""


@router.get("/status", response_model=UserStatusResponse)
async def get_status(request: Request):
    user = get_current_user(request)
    if not user:
        plan_config = PLANS["free"]
        return UserStatusResponse(
            authenticated=False,
            plan="free",
            plan_name=plan_config["name"],
            daily_limit=plan_config["daily_limit"],
            max_words=plan_config["max_words"],
            features=plan_config["features"],
        )

    plan_name = get_user_plan(user["id"])
    plan_config = PLANS.get(plan_name, PLANS["free"])
    usage = get_usage_today(user["id"])

    return UserStatusResponse(
        authenticated=True,
        plan=plan_name,
        plan_name=plan_config["name"],
        usage_today=usage,
        daily_limit=plan_config["daily_limit"],
        max_words=plan_config["max_words"],
        features=plan_config["features"],
        email=user.get("email", ""),
    )


# --- Pricing info (public) ---
@router.get("/plans")
async def get_plans():
    return {
        "plans": [
            {
                "id": "free",
                "name": "مجاني",
                "price": 0,
                "currency": "USD",
                "period": "شهرياً",
                "daily_limit": PLANS["free"]["daily_limit"],
                "max_words": PLANS["free"]["max_words"],
                "features": PLANS["free"]["features"],
            },
            {
                "id": "pro",
                "name": "احترافي",
                "price": 9,
                "currency": "USD",
                "period": "شهرياً",
                "daily_limit": PLANS["pro"]["daily_limit"],
                "max_words": PLANS["pro"]["max_words"],
                "features": PLANS["pro"]["features"],
                "popular": True,
            },
            {
                "id": "enterprise",
                "name": "مؤسسات",
                "price": -1,
                "currency": "USD",
                "period": "تواصل معنا",
                "daily_limit": PLANS["enterprise"]["daily_limit"],
                "max_words": PLANS["enterprise"]["max_words"],
                "features": PLANS["enterprise"]["features"],
            },
        ]
    }


# --- Stripe checkout session ---
@router.post("/checkout")
async def create_checkout(request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="يجب تسجيل الدخول أولاً")

    stripe = _get_stripe()
    if not STRIPE_PRO_PRICE_ID:
        raise HTTPException(status_code=503, detail="لم يتم تعيين معرف السعر")

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            payment_method_types=["card"],
            line_items=[{"price": STRIPE_PRO_PRICE_ID, "quantity": 1}],
            success_url=f"{APP_URL}?upgrade=success",
            cancel_url=f"{APP_URL}?upgrade=cancel",
            client_reference_id=user["id"],
            customer_email=user.get("email"),
            metadata={"user_id": user["id"], "plan": "pro"},
        )
        return {"url": session.url, "session_id": session.id}
    except Exception as e:
        log.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail="فشل إنشاء جلسة الدفع")


# --- Stripe customer portal (manage subscription) ---
@router.post("/portal")
async def create_portal(request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="يجب تسجيل الدخول أولاً")

    stripe = _get_stripe()

    try:
        # Find customer by email
        customers = stripe.Customer.list(email=user.get("email"), limit=1)
        if not customers.data:
            raise HTTPException(status_code=404, detail="لم يتم العثور على اشتراك")

        session = stripe.billing_portal.Session.create(
            customer=customers.data[0].id,
            return_url=APP_URL,
        )
        return {"url": session.url}
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Stripe portal error: {e}")
        raise HTTPException(status_code=500, detail="فشل فتح بوابة الإدارة")


# --- Stripe webhook ---
@router.post("/webhook")
async def stripe_webhook(request: Request):
    stripe = _get_stripe()
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")

    try:
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
        else:
            import json
            event = json.loads(payload)
    except Exception as e:
        log.error(f"Webhook verification failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid webhook")

    event_type = event.get("type", "")
    data = event.get("data", {}).get("object", {})
    log.info(f"Stripe webhook: {event_type}")

    if event_type == "checkout.session.completed":
        user_id = data.get("client_reference_id") or data.get("metadata", {}).get("user_id")
        plan = data.get("metadata", {}).get("plan", "pro")
        if user_id:
            _update_user_plan(user_id, plan)

    elif event_type == "customer.subscription.deleted":
        customer_id = data.get("customer")
        if customer_id:
            _downgrade_by_customer(stripe, customer_id)

    elif event_type == "customer.subscription.updated":
        customer_id = data.get("customer")
        status = data.get("status")
        if status in ("canceled", "unpaid", "past_due"):
            if customer_id:
                _downgrade_by_customer(stripe, customer_id)

    return {"received": True}


def _update_user_plan(user_id: str, plan: str):
    try:
        from backend.db.supabase_client import get_client
        client = get_client()
        if client:
            client.table("profiles").upsert({"id": user_id, "plan": plan}).execute()
            invalidate_plan_cache(user_id)
            log.info(f"User {user_id} upgraded to {plan}")
    except Exception as e:
        log.error(f"Failed to update plan for {user_id}: {e}")


def _downgrade_by_customer(stripe, customer_id: str):
    try:
        customer = stripe.Customer.retrieve(customer_id)
        email = customer.get("email")
        if email:
            from backend.db.supabase_client import get_client
            client = get_client()
            if client:
                result = client.table("profiles").select("id").eq("email", email).single().execute()
                if result.data:
                    user_id = result.data["id"]
                    client.table("profiles").update({"plan": "free"}).eq("id", user_id).execute()
                    invalidate_plan_cache(user_id)
                    log.info(f"User {user_id} downgraded to free")
    except Exception as e:
        log.error(f"Failed to downgrade customer {customer_id}: {e}")
