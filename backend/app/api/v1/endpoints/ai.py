from fastapi import APIRouter, UploadFile, File

from app.services.ai_service import get_ai_service

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/predict")
def predict(image: UploadFile = File(...)):
    """
    V1'de dummy sonuç döner. V2'de gerçek model bağlanınca bu endpoint'in
    imzası ve sözleşmesi DEĞİŞMEYECEK - frontend hiçbir değişiklik gerektirmeyecek.
    """
    service = get_ai_service()
    image_bytes = image.file.read()
    result = service.predict(image_bytes)
    return {
        "predicted_value": result.predicted_value,
        "confidence": result.confidence,
        "alternatives": [a.__dict__ for a in result.alternatives],
        "model_version": result.model_version,
    }
