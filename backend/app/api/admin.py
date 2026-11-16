import uuid
import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any

from app.database import get_db
from app.models.user import User
from app.models.product import Product, Category
from app.models.order import Order, OrderItem
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut
from app.schemas.order import OrderOut, OrderStatusUpdate
from app.schemas.user import UserOut
from app.utils.auth import get_current_admin_user
from app.ai.recommender import recommender

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/stats")
def get_admin_dashboard_stats(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    total_users = db.query(User).count()
    total_products = db.query(Product).count()
    total_orders = db.query(Order).count()
    total_revenue = db.query(func.sum(Order.total_amount)).scalar() or 0.0
    pending_orders = db.query(Order).filter(Order.status == "processing").count()
    low_stock = db.query(Product).filter(Product.stock <= 10).count()

    # Category breakdown
    cat_stats = []
    categories = db.query(Category).all()
    for cat in categories:
        p_count = db.query(Product).filter(Product.category_id == cat.id).count()
        cat_stats.append({
            "category": cat.name,
            "product_count": p_count
        })

    # Recent 5 orders
    recent_orders = db.query(Order).order_by(Order.created_at.desc()).limit(5).all()

    # Sales trend mock/computed (for Recharts)
    monthly_sales = [
        {"month": "Jun", "sales": 185000, "orders": 34},
        {"month": "Jul", "sales": 240000, "orders": 48},
        {"month": "Aug", "sales": 310000, "orders": 62},
        {"month": "Sep", "sales": 295000, "orders": 58},
        {"month": "Oct", "sales": 420000, "orders": 85},
        {"month": "Nov", "sales": total_revenue or 495000, "orders": total_orders or 98}
    ]

    return {
        "total_users": total_users,
        "total_products": total_products,
        "total_orders": total_orders,
        "total_revenue": round(total_revenue, 2),
        "pending_orders": pending_orders,
        "low_stock_products": low_stock,
        "category_distribution": cat_stats,
        "recent_orders": [
            {
                "id": o.id,
                "order_number": o.order_number,
                "customer": o.user.full_name if o.user else "Anonymous",
                "total": o.total_amount,
                "status": o.status,
                "date": o.created_at.isoformat()
            }
            for o in recent_orders
        ],
        "sales_trends": monthly_sales
    }

@router.get("/products", response_model=List[ProductOut])
def get_all_products_admin(admin: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.id.desc()).all()

@router.post("/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    prod_in: ProductCreate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    slug = prod_in.slug
    if not slug:
        slug = re.sub(r'[^a-zA-Z0-9]+', '-', prod_in.name.lower()).strip('-') + f"-{uuid.uuid4().hex[:4]}"

    product = Product(
        name=prod_in.name,
        slug=slug,
        description=prod_in.description,
        price=prod_in.price,
        original_price=prod_in.original_price,
        stock=prod_in.stock,
        category_id=prod_in.category_id,
        brand=prod_in.brand,
        image_url=prod_in.image_url,
        images=prod_in.images,
        features=prod_in.features,
        specifications=prod_in.specifications,
        is_featured=prod_in.is_featured
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    # Refit recommender
    recommender.fit(db.query(Product).all())
    return product

@router.put("/products/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    prod_in: ProductUpdate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = prod_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(product, field, val)

    db.commit()
    db.refresh(product)

    # Refit recommender
    recommender.fit(db.query(Product).all())
    return product

@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()

    recommender.fit(db.query(Product).all())
    return None

@router.get("/orders", response_model=List[OrderOut])
def get_all_orders_admin(admin: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    return db.query(Order).order_by(Order.created_at.desc()).all()

@router.put("/orders/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = status_update.status
    db.commit()
    db.refresh(order)
    return order

@router.get("/users", response_model=List[UserOut])
def list_all_users_admin(admin: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.id.desc()).all()
