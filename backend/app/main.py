from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.seed.seed_data import seed_database
from app.ai.gemini_service import gemini_service
from app.utils.redis_client import cache

# Ensure all models are imported so Base.metadata knows them
import app.models

# Create all tables immediately
Base.metadata.create_all(bind=engine)

# Seed database immediately if not seeded
def init_db():
    db = SessionLocal()
    try:
        seed_database(db)
    except Exception as e:
        print(f"Init DB notice: {e}")
    finally:
        db.close()

init_db()

app = FastAPI(
    title="ShopSmart AI API",
    description="High-performance AI-Powered E-Commerce Platform API with Google Gemini and Scikit-learn",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import API routers
from app.api.auth import router as auth_router
from app.api.categories import router as categories_router
from app.api.products import router as products_router
from app.api.cart import router as cart_router
from app.api.wishlist import router as wishlist_router
from app.api.orders import router as orders_router
from app.api.reviews import router as reviews_router
from app.api.coupons import router as coupons_router
from app.api.admin import router as admin_router
from app.api.ai import router as ai_router
from app.api.snap2price import router as snap2price_router

# Register API Routers under /api/v1
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(categories_router, prefix=settings.API_V1_STR)
app.include_router(products_router, prefix=settings.API_V1_STR)
app.include_router(cart_router, prefix=settings.API_V1_STR)
app.include_router(wishlist_router, prefix=settings.API_V1_STR)
app.include_router(orders_router, prefix=settings.API_V1_STR)
app.include_router(reviews_router, prefix=settings.API_V1_STR)
app.include_router(coupons_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(snap2price_router, prefix=settings.API_V1_STR)

@app.get("/")
@app.get("/api")
def root():
    return {
        "name": "ShopSmart AI API",
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs",
        "gemini_active": gemini_service.is_available()
    }

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "redis_connected": cache.client is not None,
        "gemini_model": gemini_service.model_name,
        "gemini_ready": gemini_service.is_available()
    }
