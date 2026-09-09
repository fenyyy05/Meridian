from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import health, distraction, struggle, recommend
from services.distraction_predictor import predictor
from services.resource_recommender import recommender

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load models if they are not loaded by default during import
    if not predictor.is_loaded():
        predictor._load_model()
    
    # Initialize some mock resources for the recommender
    mock_resources = [
        {"id": "1", "title": "Calculus 101", "description": "Introduction to derivatives and integrals.", "tags": ["math", "calculus"], "topic": "Derivatives", "subject": "Mathematics", "type": "video"},
        {"id": "2", "title": "Advanced Python", "description": "Deep dive into async programming.", "tags": ["programming", "python", "async"], "topic": "Async", "subject": "Computer Science", "type": "interactive"},
        {"id": "3", "title": "Physics Basics", "description": "Newton's laws of motion explained.", "tags": ["physics", "forces"], "topic": "Mechanics", "subject": "Physics", "type": "article"}
    ]
    recommender.load_resources(mock_resources)
    
    yield
    # Shutdown
    pass

app = FastAPI(title="Meridian ML Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://meridian-app.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])
app.include_router(distraction.router, tags=["Distraction"])
app.include_router(struggle.router, tags=["Struggle"])
app.include_router(recommend.router, tags=["Recommendations"])
