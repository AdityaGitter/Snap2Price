from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.wishlist import Wishlist, WishlistItem
from app.models.product import Product
from app.schemas.cart import WishlistOut, WishlistItemAdd
from app.utils.auth import get_current_user

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])

def get_or_create_wishlist(user_id: int, db: Session) -> Wishlist:
    wl = db.query(Wishlist).filter(Wishlist.user_id == user_id).first()
    if not wl:
        wl = Wishlist(user_id=user_id)
        db.add(wl)
        db.commit()
        db.refresh(wl)
    return wl

@router.get("", response_model=WishlistOut)
def get_user_wishlist(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wl = get_or_create_wishlist(current_user.id, db)
    return wl

@router.post("/items", response_model=WishlistOut)
def add_to_wishlist(item_in: WishlistItemAdd, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == item_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    wl = get_or_create_wishlist(current_user.id, db)
    existing = db.query(WishlistItem).filter(
        WishlistItem.wishlist_id == wl.id,
        WishlistItem.product_id == item_in.product_id
    ).first()

    if not existing:
        new_item = WishlistItem(wishlist_id=wl.id, product_id=item_in.product_id)
        db.add(new_item)
        db.commit()
        db.refresh(wl)

    return wl

@router.delete("/items/{product_id}", response_model=WishlistOut)
def remove_from_wishlist(product_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wl = get_or_create_wishlist(current_user.id, db)
    item = db.query(WishlistItem).filter(
        WishlistItem.wishlist_id == wl.id,
        WishlistItem.product_id == product_id
    ).first()

    if item:
        db.delete(item)
        db.commit()
        db.refresh(wl)

    return wl
