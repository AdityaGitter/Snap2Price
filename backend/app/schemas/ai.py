from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.schemas.product import ProductOut

class SmartSearchRequest(BaseModel):
    query: str

class SmartSearchFilter(BaseModel):
    category: Optional[str] = None
    brand: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_rating: Optional[float] = None
    keywords: List[str] = []
    sort_by: Optional[str] = "relevance"

class SmartSearchResponse(BaseModel):
    query: str
    interpreted_filters: SmartSearchFilter
    ai_explanation: str
    results: List[ProductOut]
    total: int

class ChatMessage(BaseModel):
    role: str  # "user", "assistant", "system"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    current_product_id: Optional[int] = None

class ChatResponse(BaseModel):
    reply: str
    suggested_products: List[ProductOut] = []
    quick_actions: List[str] = []

class CompareRequest(BaseModel):
    product_ids: List[int]

class CompareResponse(BaseModel):
    products: List[ProductOut]
    ai_comparison_verdict: str
    best_value_winner: Optional[str] = None
    best_performance_winner: Optional[str] = None
    comparison_matrix: List[Dict[str, Any]]

class VisualSearchRequest(BaseModel):
    image_base64: Optional[str] = None
    image_url: Optional[str] = None
    description_hint: Optional[str] = None

class VisualSearchResponse(BaseModel):
    detected_attributes: Dict[str, Any]
    matched_category: Optional[str] = None
    identified_product: Optional[Dict[str, Any]] = None
    confidence_score: float
    matched_products: List[ProductOut]
    search_method: str  # "gemini_multimodal_vision" or "metadata_similarity_fallback"
    ai_vision_used: bool = False
    method_explanation: Optional[str] = None
    retailer_comparison: Optional[Dict[str, Any]] = None

class RecommendationResponse(BaseModel):
    strategy: str  # "content_based", "personalized", "hybrid", "collaborative_views"
    recommendations: List[ProductOut]
