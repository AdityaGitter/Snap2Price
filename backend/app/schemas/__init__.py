from app.schemas.user import UserBase, UserCreate, UserLogin, UserOut, Token, TokenPayload
from app.schemas.product import (
    CategoryBase, CategoryCreate, CategoryOut,
    ProductBase, ProductCreate, ProductUpdate, ProductOut, ProductListResponse,
    CouponBase, CouponOut, ApplyCouponRequest, ApplyCouponResponse
)
from app.schemas.cart import (
    CartItemAdd, CartItemUpdate, CartItemOut, CartOut,
    WishlistItemAdd, WishlistItemOut, WishlistOut
)
from app.schemas.order import OrderItemOut, PaymentOut, OrderCreate, OrderOut, OrderStatusUpdate
from app.schemas.review import ReviewCreate, ReviewOut, ReviewSummary
from app.schemas.ai import (
    SmartSearchRequest, SmartSearchFilter, SmartSearchResponse,
    ChatMessage, ChatRequest, ChatResponse,
    CompareRequest, CompareResponse,
    VisualSearchRequest, VisualSearchResponse,
    RecommendationResponse
)
