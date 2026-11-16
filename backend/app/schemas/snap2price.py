from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class RetailerOfferOut(BaseModel):
    id: int
    product_id: int
    retailer_name: str
    retailer_slug: str
    brand: Optional[str] = None
    model_number: str
    product_name: str
    image_url: str
    current_price: float
    original_price: Optional[float] = None
    discount_percentage: float
    delivery_charge: float
    delivery_estimate: Optional[str] = None
    total_landed_price: float
    rating: Optional[float] = None
    review_count: int
    product_url: str
    url_verified: bool
    url_verification_note: str
    in_stock: bool
    data_source: str
    is_simulated: bool
    data_source_label: str
    last_updated: Optional[str] = None


class PriceComparisonResponse(BaseModel):
    product: Dict[str, Any]
    exact_model_matched: bool
    canonical_model_number: str
    data_disclaimer: str
    contains_simulated_data: bool
    retailer_offers: List[RetailerOfferOut]
    lowest_price_recommendation: Optional[Dict[str, Any]] = None
    adapter_statuses: List[Dict[str, Any]]


class RecordPriceRequest(BaseModel):
    retailer_name: str
    price: float = Field(..., gt=0)
    original_price: Optional[float] = None
    retailer_product_id: Optional[int] = None
    is_simulated: bool = True


class PriceAlertCreate(BaseModel):
    product_id: int
    target_price: float = Field(..., gt=0)
    notification_channel: str = Field(default="email")  # email | aws_sns | in_app
    notification_target: Optional[str] = None


class PriceAlertUpdate(BaseModel):
    target_price: Optional[float] = Field(default=None, gt=0)
    is_active: Optional[bool] = None
    notification_channel: Optional[str] = None
    notification_target: Optional[str] = None


class PriceAlertNotificationOut(BaseModel):
    id: int
    alert_id: int
    product_id: int
    product_name: Optional[str] = None
    retailer_name: str
    observed_price: float
    target_price: float
    channel: str
    delivery_status: str
    message: str
    retailer_url: Optional[str] = None
    sent_at: datetime

    class Config:
        from_attributes = True


class PriceAlertOut(BaseModel):
    id: int
    user_id: int
    product_id: int
    product_name: Optional[str] = None
    product_image: Optional[str] = None
    target_price: float
    initial_observed_price: Optional[float] = None
    latest_observed_price: Optional[float] = None
    latest_observed_retailer: Optional[str] = None
    notification_channel: str
    notification_target: Optional[str] = None
    status: str
    notification_status: str
    is_active: bool
    last_checked_at: Optional[datetime] = None
    triggered_at: Optional[datetime] = None
    created_at: datetime
    notifications: List[PriceAlertNotificationOut] = []

    class Config:
        from_attributes = True


class UrlValidationRequest(BaseModel):
    url: str
