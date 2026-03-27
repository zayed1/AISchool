# Triple-engine combiner with confidence-adaptive weighting

def combine_scores(statistical_score: float, ml_score: float, word_count: int = 200,
                   ml_scores: list[float] | None = None, ai_score: float | None = None) -> dict:

    # #1: Confidence-adaptive weighting
    # If ML model is very confident, trust it more. If uncertain, lean on statistics.
    ml_confidence = abs(ml_score - 0.5) * 2  # 0=uncertain, 1=very confident

    if ai_score is not None:
        # Pro mode: three engines
        ai_confidence = abs(ai_score - 0.5) * 2

        if ai_confidence >= 0.8:
            # AI API is very confident — trust it heavily
            ai_w, ml_w, stat_w = 0.70, 0.20, 0.10
        elif ai_confidence >= 0.5:
            ai_w, ml_w, stat_w = 0.55, 0.30, 0.15
        else:
            # AI API uncertain — spread weight more evenly
            ai_w, ml_w, stat_w = 0.40, 0.35, 0.25

        final_score = (ai_score * ai_w) + (ml_score * ml_w) + (statistical_score * stat_w)
    else:
        # Free mode: two engines with confidence-adaptive weighting
        if ml_confidence >= 0.7:
            # Model is very confident (score near 0 or 1) — trust it heavily
            ml_w = 0.90
            stat_w = 0.10
        elif ml_confidence >= 0.4:
            # Model is reasonably confident
            ml_w = 0.80
            stat_w = 0.20
        elif ml_confidence >= 0.2:
            # Model is somewhat uncertain — give statistics more say
            ml_w = 0.65
            stat_w = 0.35
        else:
            # Model is very uncertain (score ~0.5) — heavy statistical reliance
            ml_w = 0.50
            stat_w = 0.50

        # Short text adjustment — statistics more reliable for short texts
        if word_count <= 80:
            stat_boost = 0.15
            ml_w = max(0.40, ml_w - stat_boost)
            stat_w = min(0.60, stat_w + stat_boost)

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

    # Low ML confidence increases margin
    if ml_confidence < 0.3:
        margin += 4

    if ml_scores and len(ml_scores) > 1:
        import math
        mean = sum(ml_scores) / len(ml_scores)
        variance = sum((s - mean) ** 2 for s in ml_scores) / len(ml_scores)
        std = math.sqrt(variance)
        margin += std * 15

    margin = min(round(margin), 18)
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
        "ml_weight": round(ml_w, 2),
        "stat_weight": round(stat_w, 2),
    }

    if ai_score is not None:
        result["ai_powered"] = True

    return result
