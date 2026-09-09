from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_version: str

class DistractionPredictRequest(BaseModel):
    hour_of_day: int = Field(..., ge=0, le=23)
    day_of_week: int = Field(..., ge=0, le=6)
    recent_distraction_count: int = Field(..., ge=0)
    recent_distraction_duration_min: int = Field(..., ge=0)
    prev_session_duration_min: float = Field(..., ge=0.0)
    prev_focus_score: float = Field(..., ge=1.0, le=5.0)
    interruption_count: int = Field(..., ge=0)
    task_difficulty: int = Field(..., ge=1, le=5)
    historical_completion_rate: float = Field(..., ge=0.0, le=1.0)
    postponed_task_count: int = Field(..., ge=0)
    recent_productivity_score: float = Field(..., ge=0.0, le=1.0)
    recent_unfinished_tasks: int = Field(..., ge=0)

class DistractionPredictResponse(BaseModel):
    risk_level: str
    probability: float
    confidence_scores: Dict[str, float]
    explanation: str
    top_features: List[str]
    model_version: str

class TopicActivityData(BaseModel):
    topic_id: str
    topic_name: str
    completion_rate: float = Field(default=1.0)
    postpone_count: int = Field(default=0)
    time_spent_mins: float = Field(default=0.0)
    expected_time_mins: float = Field(default=30.0)
    avg_focus_score: float = Field(default=5.0)
    confidence_level: float = Field(default=5.0)
    repeat_sessions: int = Field(default=0)

class StruggleDetectRequest(BaseModel):
    topics: List[TopicActivityData]

class TopicStruggleResult(BaseModel):
    topic_id: str
    topic_name: str
    struggle_score: float
    struggle_level: str
    reasons: List[str]

class StruggleDetectResponse(BaseModel):
    topics: List[TopicStruggleResult]

class ResourceRecommendRequest(BaseModel):
    query: str
    subject: Optional[str] = None
    topic: Optional[str] = None
    struggle_level: str = Field(default="LOW")
    completed_ids: List[str] = Field(default_factory=list)
    top_k: int = Field(default=5, ge=1)

class RecommendedResource(BaseModel):
    resource: Dict[str, Any]
    score: float
    reasons: List[str]

class ResourceRecommendResponse(BaseModel):
    recommendations: List[RecommendedResource]
