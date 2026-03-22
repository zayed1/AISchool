from pydantic import BaseModel, field_validator
import re


class AnalyzeRequest(BaseModel):
    text: str
    detailed: bool = True

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("النص مطلوب")

        words = v.split()
        if len(words) < 50:
            raise ValueError("النص يجب أن يحتوي على 50 كلمة على الأقل")
        if len(words) > 5000:
            raise ValueError("النص يجب ألا يتجاوز 5000 كلمة")

        arabic_chars = len(re.findall(r'[\u0600-\u06FF]', v))
        all_alpha = len(re.findall(r'[a-zA-Z\u0600-\u06FF]', v))
        if all_alpha > 0 and arabic_chars / all_alpha < 0.3:
            raise ValueError("النص يجب أن يكون باللغة العربية بشكل أساسي")

        return v


class SentenceResult(BaseModel):
    text: str
    score: float
    flag: str


class StatisticalResult(BaseModel):
    ttr: float
    sentence_length_cv: float
    repetitive_openers_ratio: float
    connector_density: float
    error_ratio: float
    burstiness: float
    statistical_score: float


class MLResult(BaseModel):
    label: str
    confidence: float
    ml_score: float


class CombinedResult(BaseModel):
    final_score: float
    percentage: int
    level: str
    color: str


class AnalyzeResponse(BaseModel):
    result: CombinedResult
    statistical: StatisticalResult
    ml: MLResult
    sentences: list[SentenceResult]
    metadata: dict


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
