def combine_scores(statistical_score: float, ml_score: float) -> dict:
    final_score = (ml_score * 0.65) + (statistical_score * 0.35)

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
        "percentage": round(final_score * 100),
        "level": level,
        "color": color,
    }
