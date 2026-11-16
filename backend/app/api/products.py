from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List

from app.database import get_db
from app.models.product import Product, Category, ProductView
from app.models.user import User
from app.schemas.product import ProductOut, ProductListResponse
from app.utils.auth import get_optional_current_user
from app.ai.recommender import recommender

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("", response_model=ProductListResponse)
def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    sort_by: Optional[str] = "newest",  # newest, price_asc, price_desc, rating, popularity
    db: Session = Depends(get_db)
):
    query = db.query(Product)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
                Product.brand.ilike(search_term)
            )
        )

    if category:
        cat_obj = db.query(Category).filter(
            or_(Category.slug == category, Category.name.ilike(category))
        ).first()
        if cat_obj:
            query = query.filter(Product.category_id == cat_obj.id)

    if brand:
        query = query.filter(Product.brand.ilike(brand))

    if min_price is not None:
        query = query.filter(Product.price >= min_price)

    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    if min_rating is not None:
        query = query.filter(Product.rating >= min_rating)

    # Sorting
    if sort_by == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort_by == "rating":
        query = query.order_by(Product.rating.desc())
    elif sort_by == "popularity":
        query = query.order_by(Product.review_count.desc(), Product.rating.desc())
    else:  # newest
        query = query.order_by(Product.created_at.desc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }

@router.get("/featured", response_model=List[ProductOut])
def get_featured_products(limit: int = 8, db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.is_featured == True).limit(limit).all()
    if not products:
        products = db.query(Product).order_by(Product.rating.desc()).limit(limit).all()
    return products

@router.get("/brands", response_model=List[str])
def get_all_brands(db: Session = Depends(get_db)):
    brands = db.query(Product.brand).distinct().all()
    return sorted([b[0] for b in brands if b[0]])

@router.get("/{id_or_slug}", response_model=ProductOut)
def get_product(
    id_or_slug: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    if id_or_slug.isdigit():
        prod = db.query(Product).filter(Product.id == int(id_or_slug)).first()
    else:
        prod = db.query(Product).filter(Product.slug == id_or_slug).first()

    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    # Record view interaction for recommendation engine
    try:
        user_id = current_user.id if current_user else None
        view = ProductView(product_id=prod.id, user_id=user_id)
        db.add(view)
        db.commit()
    except Exception:
        db.rollback()

    return prod

@router.get("/{id}/similar", response_model=List[ProductOut])
def get_similar_products_route(id: int, limit: int = 5, db: Session = Depends(get_db)):
    target = db.query(Product).filter(Product.id == id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Product not found")
    similar = recommender.get_similar_products(product_id=id, db=db, top_n=limit)
    return similar
