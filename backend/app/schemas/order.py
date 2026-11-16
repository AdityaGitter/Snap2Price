from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class OrderItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_price: float
    product_image: Optional[str] = None
    quantity: int
    subtotal: float

    class Config:
        from_attributes = True

class PaymentOut(BaseModel):
    id: int
    payment_method: str
    transaction_id: str
    amount: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    shipping_address: str
    shipping_city: str
    shipping_postal_code: str
    shipping_country: str = "India"
    coupon_code: Optional[str] = None
    payment_method: str = "simulated_card"
    simulate_failure: bool = False  # For academic demonstration of simulated payment failure

class OrderOut(BaseModel):
    id: int
    order_number: str
    user_id: int
    status: str
    subtotal: float
    discount: float
    tax: float
    total_amount: float
    shipping_address: str
    shipping_city: str
    shipping_postal_code: str
    shipping_country: str
    coupon_code: Optional[str] = None
    created_at: datetime
    items: List[OrderItemOut]
    payment: Optional[PaymentOut] = None

    class Config:
        from_attributes = True

class OrderStatusUpdate(BaseModel):
    status: str  # processing, shipped, delivered, cancelled
