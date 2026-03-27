import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
MODEL_NAME = os.getenv("MODEL_NAME", "sabaridsnfuji/arabic-ai-text-detector")
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PRO_PRICE_ID = os.getenv("STRIPE_PRO_PRICE_ID", "")
APP_URL = os.getenv("APP_URL", "http://localhost:5173")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
MIN_WORDS = 50
MAX_WORDS = 5000
MIN_ARABIC_RATIO = 0.3

# Plan definitions
PLANS = {
    "free": {
        "name": "مجاني",
        "daily_limit": 10,
        "max_words": 1000,
        "features": ["تحليل أساسي", "تصدير PDF"],
    },
    "pro": {
        "name": "احترافي",
        "daily_limit": 200,
        "max_words": 5000,
        "features": ["تحليل أساسي", "تصدير PDF", "وضع المعلم", "تحليل دفعي", "تحليل مفصل"],
    },
    "enterprise": {
        "name": "مؤسسات",
        "daily_limit": 999999,
        "max_words": 5000,
        "features": ["كل المميزات", "دعم أولوية", "webhook"],
    },
}
