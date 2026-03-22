from backend.config import SUPABASE_URL, SUPABASE_KEY

_client = None


def get_client():
    global _client
    if _client is None and SUPABASE_URL and SUPABASE_KEY:
        from supabase import create_client
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _client


def save_scan(
    text_hash: str,
    word_count: int,
    final_score: float,
    statistical_score: float,
    ml_score: float,
    user_id: str | None = None,
):
    client = get_client()
    if client is None:
        return None

    data = {
        "text_hash": text_hash,
        "word_count": word_count,
        "final_score": final_score,
        "statistical_score": statistical_score,
        "ml_score": ml_score,
    }
    if user_id:
        data["user_id"] = user_id

    return client.table("scans").insert(data).execute()
