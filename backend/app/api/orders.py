import uuid
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem, Payment
from app.models.product import Product, Coupon
from app.schemas.order import OrderCreate, OrderOut
from app.utils.auth import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.get("", response_model=List[OrderOut])
def list_user_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()

@router.get("/{order_number}", response_model=OrderOut)
def get_order_by_number(order_number: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_number == order_number).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this order")
    return order

@router.post("/checkout", response_model=OrderOut)
def checkout(order_in: OrderCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Cannot checkout an empty shopping cart")

    # Check stock & compute subtotal
    subtotal = 0.0
    for item in cart.items:
        if not item.product or item.product.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Product '{item.product.name if item.product else 'Unknown'}' is out of stock"
            )
        subtotal += item.product.price * item.quantity

    # Apply Coupon if present
    discount = 0.0
    if order_in.coupon_code:
        coupon = db.query(Coupon).filter(
            Coupon.code == order_in.coupon_code.strip().upper(),
            Coupon.is_active == True
        ).first()
        if coupon and subtotal >= coupon.min_order_amount:
            discount = (subtotal * coupon.discount_percentage) / 100.0
            if coupon.max_discount_amount and discount > coupon.max_discount_amount:
                discount = coupon.max_discount_amount

    # Tax: 18% GST on discounted amount
    taxable_amount = max(0.0, subtotal - discount)
    tax = round(taxable_amount * 0.18, 2)
    final_amount = round(taxable_amount + tax, 2)

    # Simulated Payment Processing
    if order_in.simulate_failure:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Simulated Payment Failed: Card declined by issuing bank (Academic Demo Simulation)."
        )

    order_num = f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    tx_id = f"SIM-TXN-{uuid.uuid4().hex[:10].upper()}"

    order = Order(
        order_number=order_num,
        user_id=current_user.id,
        status="processing",
        subtotal=subtotal,
        discount=round(discount, 2),
        tax=tax,
        total_amount=final_amount,
        shipping_address=order_in.shipping_address,
        shipping_city=order_in.shipping_city,
        shipping_postal_code=order_in.shipping_postal_code,
        shipping_country=order_in.shipping_country,
        coupon_code=order_in.coupon_code
    )
    db.add(order)
    db.flush()

    # Create Order Items and reduce stock
    for item in cart.items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            product_name=item.product.name,
            product_price=item.product.price,
            product_image=item.product.image_url,
            quantity=item.quantity,
            subtotal=item.product.price * item.quantity
        )
        db.add(order_item)
        item.product.stock -= item.quantity

    # Record Simulated Payment
    payment = Payment(
        order_id=order.id,
        payment_method=order_in.payment_method,
        transaction_id=tx_id,
        amount=final_amount,
        status="completed",
        payment_gateway_response=json.dumps({
            "gateway": "Simulated Academic Gateway",
            "simulation_notice": "Academic Final Year Demo - No real payment charged",
            "currency": "INR",
            "auth_code": "AUTH_SIM_OK_9921",
            "timestamp": datetime.utcnow().isoformat()
        })
    )
    db.add(payment)

    # Empty Cart
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()
    db.refresh(order)

    return order
