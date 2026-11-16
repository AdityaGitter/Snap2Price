from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.schemas.cart import CartOut, CartItemAdd, CartItemUpdate
from app.utils.auth import get_current_user

router = APIRouter(prefix="/cart", tags=["Cart"])

def get_or_create_cart(user_id: int, db: Session) -> Cart:
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart

@router.get("", response_model=CartOut)
def get_user_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = get_or_create_cart(current_user.id, db)
    subtotal = sum(item.product.price * item.quantity for item in cart.items if item.product)
    total_items = sum(item.quantity for item in cart.items)
    
    return {
        "id": cart.id,
        "user_id": cart.user_id,
        "items": cart.items,
        "subtotal": subtotal,
        "total_items": total_items
    }

@router.post("/items", response_model=CartOut)
def add_to_cart(item_in: CartItemAdd, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == item_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.stock < item_in.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock available")

    cart = get_or_create_cart(current_user.id, db)
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == item_in.product_id
    ).first()

    if existing_item:
        existing_item.quantity += item_in.quantity
    else:
        new_item = CartItem(
            cart_id=cart.id,
            product_id=item_in.product_id,
            quantity=item_in.quantity
        )
        db.add(new_item)

    db.commit()
    db.refresh(cart)

    subtotal = sum(item.product.price * item.quantity for item in cart.items if item.product)
    total_items = sum(item.quantity for item in cart.items)

    return {
        "id": cart.id,
        "user_id": cart.user_id,
        "items": cart.items,
        "subtotal": subtotal,
        "total_items": total_items
    }

@router.put("/items/{item_id}", response_model=CartOut)
def update_cart_item(item_id: int, item_in: CartItemUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = get_or_create_cart(current_user.id, db)
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    if item_in.quantity <= 0:
        db.delete(item)
    else:
        item.quantity = item_in.quantity

    db.commit()
    db.refresh(cart)

    subtotal = sum(i.product.price * i.quantity for i in cart.items if i.product)
    total_items = sum(i.quantity for i in cart.items)

    return {
        "id": cart.id,
        "user_id": cart.user_id,
        "items": cart.items,
        "subtotal": subtotal,
        "total_items": total_items
    }

@router.delete("/items/{item_id}", response_model=CartOut)
def remove_from_cart(item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = get_or_create_cart(current_user.id, db)
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(item)
    db.commit()
    db.refresh(cart)

    subtotal = sum(i.product.price * i.quantity for i in cart.items if i.product)
    total_items = sum(i.quantity for i in cart.items)

    return {
        "id": cart.id,
        "user_id": cart.user_id,
        "items": cart.items,
        "subtotal": subtotal,
        "total_items": total_items
    }

@router.delete("/clear", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = get_or_create_cart(current_user.id, db)
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()
    return None
