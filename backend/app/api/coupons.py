from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.product import Coupon
from app.schemas.product import CouponOut, ApplyCouponRequest, ApplyCouponResponse

router = APIRouter(prefix="/coupons", tags=["Coupons"])

@router.get("", response_model=List[CouponOut])
def list_active_coupons(db: Session = Depends(get_db)):
    return db.query(Coupon).filter(Coupon.is_active == True).all()

@router.post("/apply", response_model=ApplyCouponResponse)
def apply_coupon(req: ApplyCouponRequest, db: Session = Depends(get_db)):
    code_clean = req.code.strip().upper()
    coupon = db.query(Coupon).filter(Coupon.code == code_clean, Coupon.is_active == True).first()

    if not coupon:
        return ApplyCouponResponse(
            valid=False,
            code=req.code,
            discount_percentage=0.0,
            discount_amount=0.0,
            message="Invalid or expired coupon code."
        )

    if req.order_amount < coupon.min_order_amount:
        return ApplyCouponResponse(
            valid=False,
            code=coupon.code,
            discount_percentage=coupon.discount_percentage,
            discount_amount=0.0,
            message=f"Coupon requires a minimum order value of ₹{coupon.min_order_amount:,}."
        )

    discount = (req.order_amount * coupon.discount_percentage) / 100.0
    if coupon.max_discount_amount and discount > coupon.max_discount_amount:
        discount = coupon.max_discount_amount

    return ApplyCouponResponse(
        valid=True,
        code=coupon.code,
        discount_percentage=coupon.discount_percentage,
        discount_amount=round(discount, 2),
        message=f"Coupon '{coupon.code}' applied! You saved ₹{round(discount, 2):,}."
    )
