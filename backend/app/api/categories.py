from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.product import Category, Product
from app.schemas.product import CategoryOut

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    results = []
    for cat in categories:
        count = db.query(Product).filter(Product.category_id == cat.id).count()
        results.append(CategoryOut(
            id=cat.id,
            name=cat.name,
            slug=cat.slug,
            description=cat.description,
            image_url=cat.image_url,
            created_at=cat.created_at,
            product_count=count
        ))
    return results

@router.get("/{slug}", response_model=CategoryOut)
def get_category_by_slug(slug: str, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.slug == slug).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    count = db.query(Product).filter(Product.category_id == cat.id).count()
    return CategoryOut(
        id=cat.id,
        name=cat.name,
        slug=cat.slug,
        description=cat.description,
        image_url=cat.image_url,
        created_at=cat.created_at,
        product_count=count
    )
