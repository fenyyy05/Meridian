from fastapi import APIRouter
from api.schemas import ResourceRecommendRequest, ResourceRecommendResponse
from services.resource_recommender import recommender

router = APIRouter()

@router.post("/recommend/resources", response_model=ResourceRecommendResponse)
async def recommend_resources(request: ResourceRecommendRequest):
    # In a real system, you would load resources from a DB. 
    # Here we assume the recommender is either pre-loaded or we can test it with some mock data.
    # For now we'll just query it.
    results = recommender.recommend(
        query=request.query,
        subject=request.subject,
        topic=request.topic,
        struggle_level=request.struggle_level,
        completed_ids=request.completed_ids,
        top_k=request.top_k
    )
    return ResourceRecommendResponse(recommendations=results)
