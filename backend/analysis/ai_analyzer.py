# AI-powered analysis using Claude API — for Pro subscribers only
import os
import json
from backend.utils.logging import get_logger

log = get_logger("ai_analyzer")

_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")


def is_available() -> bool:
    return bool(_API_KEY)


# B: Few-shot examples for better accuracy
_SYSTEM_PROMPT = """أنت خبير متخصص في كشف النصوص العربية المولدة بالذكاء الاصطناعي. مهمتك تحليل النص وتحديد احتمال أنه مولّد بواسطة AI.

## علامات النص المولّد بالذكاء الاصطناعي:
1. افتتاحيات نمطية متكررة: "بالإضافة إلى ذلك"، "من الجدير بالذكر"، "علاوة على ذلك"، "في هذا السياق"، "يُعدّ"
2. أدوات ربط مفرطة ومتشابهة بين الجمل
3. جمل متساوية الطول تقريباً (انتظام غير طبيعي)
4. أسلوب رسمي موحد بلا شخصية أو عاطفة
5. غياب شبه تام للأخطاء الإملائية والنحوية
6. غياب العامية والتعبيرات الشخصية
7. بنية فقرات منظمة بشكل مثالي (مقدمة، عرض، خاتمة)
8. تكرار بنيوي في هيكل الجمل

## علامات النص البشري:
1. أخطاء إملائية ونحوية عفوية
2. خلط بين الفصحى والعامية
3. تعبيرات شخصية وعاطفية
4. تفاوت في أطوال الجمل
5. استطرادات وانحرافات عن الموضوع
6. أسلوب غير منتظم (أحياناً رسمي وأحياناً عفوي)

## أمثلة:

### نص AI (درجة: 0.92):
"يُعدّ التعليم الإلكتروني من أهم التطورات في المجال التعليمي. بالإضافة إلى ذلك، فإن التكنولوجيا الحديثة أسهمت في تطوير أساليب التدريس. من الجدير بالذكر أن المؤسسات التعليمية بدأت تتبنى هذه الأساليب بشكل متزايد."

### نص بشري (درجة: 0.15):
"الحياة في القرية غير عن المدينة بصراحة. أنا شخصياً أحب الهدوء اللي هناك.. لما كنت صغير كنت أروح لجدي كل صيف والله أيام حلوة ما تتعوض. بس المشكلة إن ما فيه فرص عمل كثير."

أجب بـ JSON فقط بدون أي نص إضافي."""


def analyze_with_ai(text: str) -> dict | None:
    if not _API_KEY:
        return None

    try:
        import httpx

        user_msg = f"""حلل هذا النص وحدد احتمال أنه مولّد بالذكاء الاصطناعي:

---
{text[:4000]}
---

أجب بهذا الشكل فقط:
{{"score": 0.0-1.0, "label": "AI" أو "HUMAN", "confidence": 0.0-1.0, "reason": "سبب مختصر بالعربية في جملة واحدة"}}"""

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
                "system": _SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": user_msg}],
            },
            timeout=15.0,
        )

        if response.status_code != 200:
            log.warning(f"Claude API error: {response.status_code} — {response.text[:200]}")
            return None

        data = response.json()
        content = data.get("content", [{}])[0].get("text", "")

        # Extract JSON from response (handle markdown code blocks)
        clean = content.strip()
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

        result = json.loads(clean)
        score = max(0.0, min(1.0, float(result.get("score", 0.5))))
        label = result.get("label", "HUMAN")
        confidence = max(0.0, min(1.0, float(result.get("confidence", 0.5))))
        reason = result.get("reason", "")

        log.info(f"AI analysis: score={score}, label={label}")

        return {
            "ai_score": round(score, 3),
            "ai_label": label,
            "ai_confidence": round(confidence, 3),
            "ai_reason": reason,
        }

    except json.JSONDecodeError as e:
        log.warning(f"Failed to parse Claude response: {e}")
        return None
    except Exception as e:
        log.warning(f"AI analysis failed: {e}")
        return None
