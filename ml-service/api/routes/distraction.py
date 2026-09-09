from fastapi import APIRouter, HTTPException
from api.schemas import DistractionPredictRequest, DistractionPredictResponse
from services.distraction_predictor import predictor

router = APIRouter()

@router.post("/predict/distraction-risk", response_model=DistractionPredictResponse)
async def predict_distraction(request: DistractionPredictRequest):
    if not predictor.is_loaded():
        raise HTTPException(status_code=503, detail="Distraction model is not loaded or available.")
        
    try:
        result = predictor.predict(request.model_dump())
        return DistractionPredictResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
