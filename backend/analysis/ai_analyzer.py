# AI-powered analysis using Claude API — for Pro subscribers only
import os
import json
from backend.utils.logging import get_logger

log = get_logger("ai_analyzer")

_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")


def is_available() -> bool:
    return bool(_API_KEY)


def analyze_with_ai(text: str) -> dict | None:
    """Analyze text using Claude API. Returns AI score and reasoning."""
    if not _API_KEY:
        return None

    try:
        import httpx

        prompt = f"""أنت خبير في كشف النصوص المولدة بالذكاء الاصطناعي باللغة العربية.

حلل النص التالي وحدد احتمال أنه مكتوب بواسطة ذكاء اصطناعي (مثل ChatGPT أو Claude أو Gemini).

انتبه لهذه العلامات:
- التكرار في بنية الجمل والافتتاحيات
- استخدام مفرط لأدوات الربط (بالإضافة إلى ذلك، علاوة على ذلك...)
- تنوع مفردات منخفض أو مرتفع بشكل غير طبيعي
- غياب الأخطاء الإملائية والعامية
- أسلوب رسمي موحد بلا شخصية
- جمل متساوية الطول تقريباً

النص:
---
{text[:3000]}
---

أجب بـ JSON فقط بهذا الشكل بدون أي نص إضافي:
{{"score": 0.0-1.0, "label": "AI" أو "HUMAN", "confidence": 0.0-1.0, "reason": "سبب مختصر بالعربية"}}"""

        response = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": _API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-haiku-4-5-20251001",
                "max_tokens": 200,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=15.0,
        )

        if response.status_code != 200:
            log.warning(f"Claude API error: {response.status_code}")
            return None

        data = response.json()
        content = data.get("content", [{}])[0].get("text", "")

        # Parse JSON from response
        result = json.loads(content.strip())
        score = float(result.get("score", 0.5))
        label = result.get("label", "HUMAN")
        confidence = float(result.get("confidence", 0.5))
        reason = result.get("reason", "")

        log.info(f"AI analysis: score={score}, label={label}, confidence={confidence}")

        return {
            "ai_score": round(score, 3),
            "ai_label": label,
            "ai_confidence": round(confidence, 3),
            "ai_reason": reason,
        }

    except json.JSONDecodeError:
        log.warning("Failed to parse Claude API response as JSON")
        return None
    except Exception as e:
        log.warning(f"AI analysis failed: {e}")
        return None
