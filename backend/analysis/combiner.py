# Dynamic weights: ML model gets higher priority since it's trained specifically for this task
# Statistical analysis serves as a supporting signal

def combine_scores(statistical_score: float, ml_score: float, word_count: int = 200, ml_scores: list[float] | None = None) -> dict:
    # ML model gets dominant weight — it's trained on actual AI vs human data
    # Statistical analysis provides supplementary signals
    if word_count <= 80:
        ml_weight, stat_weight = 0.65, 0.35
    elif word_count <= 150:
        ml_weight, stat_weight = 0.75, 0.25
    elif word_count <= 500:
        ml_weight, stat_weight = 0.85, 0.15
    else:
        ml_weight, stat_weight = 0.85, 0.15

    final_score = (ml_score * ml_weight) + (statistical_score * stat_weight)

    # Confidence interval based on agreement and chunk variance
    margin = 0.0
    disagreement = abs(ml_score - statistical_score)
    margin += disagreement * 8

    if word_count < 100:
        margin += 5
    elif word_count < 200:
        margin += 3

    if ml_scores and len(ml_scores) > 1:
        import math
        mean = sum(ml_scores) / len(ml_scores)
        variance = sum((s - mean) ** 2 for s in ml_scores) / len(ml_scores)
        std = math.sqrt(variance)
        margin += std * 15

    margin = min(round(margin), 15)
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
