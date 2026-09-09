from fastapi import APIRouter, Request
from api.schemas import HealthResponse
from services.distraction_predictor import predictor

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check(request: Request):
    model_loaded = predictor.is_loaded()
    version = predictor.metadata.get("version", "unknown") if model_loaded else "unavailable"
    return HealthResponse(
        status="ok",
        model_loaded=model_loaded,
        model_version=version
    )
