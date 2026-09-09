from fastapi import APIRouter
from api.schemas import StruggleDetectRequest, StruggleDetectResponse
from services.struggle_detector import detector

router = APIRouter()

@router.post("/predict/topic-struggle", response_model=StruggleDetectResponse)
async def detect_struggle(request: StruggleDetectRequest):
    results = detector.detect([t.model_dump() for t in request.topics])
    return StruggleDetectResponse(topics=results)
