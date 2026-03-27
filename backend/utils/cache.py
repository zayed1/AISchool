# B1 — In-memory LRU cache for analysis results keyed by text SHA256 hash
import hashlib
import time
from collections import OrderedDict

_MAX_SIZE = 200
_TTL_SECONDS = 3600  # 1 hour

_cache: OrderedDict = OrderedDict()


def _hash_text(text: str) -> str:
    return hashlib.sha256(text.strip().encode("utf-8")).hexdigest()


def get_cached(text: str) -> dict | None:
    key = _hash_text(text)
    if key in _cache:
        entry = _cache[key]
        if time.time() - entry["ts"] < _TTL_SECONDS:
            _cache.move_to_end(key)
            return entry["data"]
        else:
            del _cache[key]
    return None


def set_cached(text: str, data: dict):
    key = _hash_text(text)
    _cache[key] = {"data": data, "ts": time.time()}
    _cache.move_to_end(key)
    while len(_cache) > _MAX_SIZE:
        _cache.popitem(last=False)


def clear_cache():
    _cache.clear()


def cache_stats() -> dict:
    return {"size": len(_cache), "max_size": _MAX_SIZE, "ttl": _TTL_SECONDS}
