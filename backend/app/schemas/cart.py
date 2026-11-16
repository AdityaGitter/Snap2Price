from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.schemas.product import ProductOut

class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = 1

class CartItemUpdate(BaseModel):
    quantity: int

class CartItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: ProductOut

    class Config:
        from_attributes = True

class CartOut(BaseModel):
    id: int
    user_id: int
    items: List[CartItemOut]
    subtotal: float
    total_items: int

    class Config:
        from_attributes = True

class WishlistItemAdd(BaseModel):
    product_id: int

class WishlistItemOut(BaseModel):
    id: int
    product_id: int
    product: ProductOut

    class Config:
        from_attributes = True

class WishlistOut(BaseModel):
    id: int
    user_id: int
    items: List[WishlistItemOut]

    class Config:
        from_attributes = True
