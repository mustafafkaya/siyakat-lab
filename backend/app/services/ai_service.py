"""
AI tanıma/benzerlik servisi arayüzü.

ÖNEMLİ: Bu dosyanın amacı, V2'de gerçek model devreye girdiğinde
API endpoint'lerinin (app/api/v1/endpoints/ai.py) DEĞİŞMEMESİDİR.
Sadece DummyAIService yerine RealAIService bağlanacak; girdi/çıktı
sözleşmesi (PredictionResult) aynı kalacak.

Yol haritası akışı:
Görsel → ön işleme → model servisi → tahmin → güven → alternatifler → benzer örnekler
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List

from app.core.config import settings


@dataclass
class AlternativePrediction:
    value: str
    confidence: float


@dataclass
class PredictionResult:
    predicted_value: str
    confidence: float
    alternatives: List[AlternativePrediction] = field(default_factory=list)
    embedding: List[float] = field(default_factory=list)
    model_version: str = "dummy-v0"


class AIService(ABC):
    @abstractmethod
    def predict(self, image_bytes: bytes) -> PredictionResult:
        ...

    @abstractmethod
    def find_similar(self, embedding: List[float], top_k: int = 5) -> List[str]:
        """Benzer doğrulanmış örneklerin ID listesini döner."""


class DummyAIService(AIService):
    """
    Gerçek veri/model gelene kadar kullanılan sahte servis.
    Sabit ama gerçekçi görünen bir çıktı üretir, böylece frontend ve
    API akışı gerçek modelmiş gibi geliştirilip test edilebilir.
    """

    def predict(self, image_bytes: bytes) -> PredictionResult:
        return PredictionResult(
            predicted_value="—",
            confidence=0.0,
            alternatives=[],
            embedding=[],
            model_version="dummy-v0",
        )

    def find_similar(self, embedding: List[float], top_k: int = 5) -> List[str]:
        return []


def get_ai_service() -> AIService:
    if settings.AI_SERVICE_MODE == "dummy":
        return DummyAIService()
    # elif settings.AI_SERVICE_MODE == "real":
    #     return RealAIService(...)  # V2'de eklenecek
    raise ValueError(f"Bilinmeyen AI_SERVICE_MODE: {settings.AI_SERVICE_MODE}")
