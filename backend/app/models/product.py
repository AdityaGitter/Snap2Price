from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    products = relationship("Product", back_populates="category", cascade="all, delete-orphan")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), unique=True, nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=True)
    stock = Column(Integer, default=10, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    brand = Column(String(100), nullable=True, index=True)
    rating = Column(Float, default=4.5)
    review_count = Column(Integer, default=0)
    image_url = Column(String(500), nullable=False)
    images = Column(Text, nullable=True)  # JSON or comma-separated additional images
    features = Column(Text, nullable=True)  # JSON or newline-separated features
    specifications = Column(Text, nullable=True)  # JSON format key-value pairs
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    category = relationship("Category", back_populates="products")
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")
    cart_items = relationship("CartItem", back_populates="product", cascade="all, delete-orphan")
    wishlist_items = relationship("WishlistItem", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")
    views = relationship("ProductView", back_populates="product", cascade="all, delete-orphan")
    retailer_listings = relationship("RetailerProduct", back_populates="product", cascade="all, delete-orphan")
    price_history_entries = relationship("PriceHistory", back_populates="product", cascade="all, delete-orphan")
    price_alerts = relationship("PriceAlert", back_populates="product", cascade="all, delete-orphan")

class ProductView(Base):
    __tablename__ = "product_views"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    viewed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="views")
    product = relationship("Product", back_populates="views")

class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    discount_percentage = Column(Float, nullable=False)  # e.g., 10.0 for 10%
    max_discount_amount = Column(Float, nullable=True)
    min_order_amount = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    expiry_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
