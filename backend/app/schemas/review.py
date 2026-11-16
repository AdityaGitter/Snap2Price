from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReviewCreate(BaseModel):
    product_id: int
    rating: float = Field(ge=1, le=5)
    title: Optional[str] = None
    comment: str

class ReviewOut(BaseModel):
    id: int
    product_id: int
    user_id: int
    user_name: Optional[str] = None
    rating: float
    title: Optional[str] = None
    comment: str
    verified_purchase: int
    sentiment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewSummary(BaseModel):
    product_id: int
    average_rating: float
    total_reviews: int
    sentiment_breakdown: dict
    ai_summary: Optional[str] = None
    key_pros: list[str] = []
    key_cons: list[str] = []
