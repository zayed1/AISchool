# #1 — Dynamic weights based on text length
# #3 — Confidence interval support

def combine_scores(statistical_score: float, ml_score: float, word_count: int = 200, ml_scores: list[float] | None = None) -> dict:
    # #1 — Dynamic weights: short texts rely more on statistics
    if word_count <= 80:
        ml_weight, stat_weight = 0.45, 0.55
    elif word_count <= 150:
        ml_weight, stat_weight = 0.55, 0.45
    elif word_count <= 500:
        ml_weight, stat_weight = 0.65, 0.35
    else:
        ml_weight, stat_weight = 0.70, 0.30

    final_score = (ml_score * ml_weight) + (statistical_score * stat_weight)

    # #3 — Confidence interval based on agreement and chunk variance
    margin = 0.0
    # Disagreement between ML and statistical adds uncertainty
    disagreement = abs(ml_score - statistical_score)
    margin += disagreement * 8  # up to ~8% margin

    # Short texts have wider intervals
    if word_count < 100:
        margin += 5
    elif word_count < 200:
        margin += 3

    # Chunk variance from ML (if available)
    if ml_scores and len(ml_scores) > 1:
        import math
        mean = sum(ml_scores) / len(ml_scores)
        variance = sum((s - mean) ** 2 for s in ml_scores) / len(ml_scores)
        std = math.sqrt(variance)
        margin += std * 15  # scale variance to percentage margin

    margin = min(round(margin), 15)  # cap at 15%
    percentage = round(final_score * 100)
    confidence_low = max(0, percentage - margin)
    confidence_high = min(100, percentage + margin)

    if final_score >= 0.85:
        level = "مرجّح بشدة أنه مولّد بالذكاء الاصطناعي"
        color = "red"
    elif final_score >= 0.65:
        level = "مؤشرات قوية على استخدام الذكاء الاصطناعي"
        color = "orange"
    elif final_score >= 0.45:
        level = "غير واضح — يحتاج مراجعة يدوية"
        color = "yellow"
    elif final_score >= 0.25:
        level = "مؤشرات قوية على الكتابة البشرية"
        color = "lightgreen"
    else:
        level = "مرجّح بشدة أنه مكتوب بشرياً"
        color = "green"

    return {
        "final_score": round(final_score, 2),
        "percentage": percentage,
        "level": level,
        "color": color,
        "confidence_low": confidence_low,
        "confidence_high": confidence_high,
        "ml_weight": ml_weight,
        "stat_weight": stat_weight,
    }
