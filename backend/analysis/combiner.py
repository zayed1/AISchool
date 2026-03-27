# Triple-engine combiner: statistical + ML model + AI API (optional)

def combine_scores(statistical_score: float, ml_score: float, word_count: int = 200,
                   ml_scores: list[float] | None = None, ai_score: float | None = None) -> dict:

    if ai_score is not None:
        # Pro mode: three engines — AI API gets highest trust
        if word_count <= 80:
            ai_w, ml_w, stat_w = 0.50, 0.30, 0.20
        elif word_count <= 150:
            ai_w, ml_w, stat_w = 0.55, 0.30, 0.15
        else:
            ai_w, ml_w, stat_w = 0.60, 0.25, 0.15

        final_score = (ai_score * ai_w) + (ml_score * ml_w) + (statistical_score * stat_w)
    else:
        # Free mode: two engines — ML model dominates
        if word_count <= 80:
            ml_w, stat_w = 0.65, 0.35
        elif word_count <= 150:
            ml_w, stat_w = 0.75, 0.25
        else:
            ml_w, stat_w = 0.85, 0.15

        final_score = (ml_score * ml_w) + (statistical_score * stat_w)

    # Confidence interval
    margin = 0.0
    disagreement = abs(ml_score - statistical_score)
    margin += disagreement * 8

    if ai_score is not None:
        ai_disagreement = abs(ai_score - ml_score)
        margin += ai_disagreement * 4

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

    result = {
        "final_score": round(final_score, 2),
        "percentage": percentage,
        "level": level,
        "color": color,
        "confidence_low": confidence_low,
        "confidence_high": confidence_high,
        "ml_weight": ml_w if ai_score is None else ml_w,
        "stat_weight": stat_w,
    }

    if ai_score is not None:
        result["ai_powered"] = True

    return result
