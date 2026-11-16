from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int
    created_at: datetime
    product_count: Optional[int] = 0

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    description: str
    price: float
    original_price: Optional[float] = None
    stock: int = 10
    category_id: int
    brand: Optional[str] = None
    image_url: str
    images: Optional[str] = None
    features: Optional[str] = None
    specifications: Optional[str] = None
    is_featured: bool = False

class ProductCreate(ProductBase):
    slug: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    stock: Optional[int] = None
    category_id: Optional[int] = None
    brand: Optional[str] = None
    image_url: Optional[str] = None
    images: Optional[str] = None
    features: Optional[str] = None
    specifications: Optional[str] = None
    is_featured: Optional[bool] = None

class ProductOut(ProductBase):
    id: int
    slug: str
    rating: float
    review_count: int
    created_at: datetime
    category: Optional[CategoryBase] = None

    class Config:
        from_attributes = True

class ProductListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[ProductOut]

class CouponBase(BaseModel):
    code: str
    discount_percentage: float
    max_discount_amount: Optional[float] = None
    min_order_amount: float = 0.0
    is_active: bool = True

class CouponOut(CouponBase):
    id: int
    expiry_date: Optional[datetime] = None

    class Config:
        from_attributes = True

class ApplyCouponRequest(BaseModel):
    code: str
    order_amount: float

class ApplyCouponResponse(BaseModel):
    valid: bool
    code: str
    discount_percentage: float
    discount_amount: float
    message: str
