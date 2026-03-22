import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
MODEL_NAME = "sabaridsnfuji/arabic-ai-text-detector"
MIN_WORDS = 50
MAX_WORDS = 5000
MIN_ARABIC_RATIO = 0.3
