import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.snap2price import RetailerProduct, PriceAlert, PriceAlertNotification
from app.schemas.snap2price import (
    PriceComparisonResponse,
    RecordPriceRequest,
    PriceAlertCreate,
    PriceAlertUpdate,
    PriceAlertOut,
    PriceAlertNotificationOut,
    UrlValidationRequest,
)
from app.utils.auth import get_current_user
from app.services.retailer_adapter import (
    retailer_comparison_service,
    validate_retailer_url,
    generate_model_number,
)
from app.services.price_alert_service import price_alert_service

router = APIRouter(prefix="/snap2price", tags=["Snap2Price Comparison & Alerts"])


def _serialize_alert(alert: PriceAlert) -> PriceAlertOut:
    notif_outs = []
    for n in sorted(alert.notifications, key=lambda x: x.sent_at, reverse=True):
        notif_outs.append(
            PriceAlertNotificationOut(
                id=n.id,
                alert_id=n.alert_id,
                product_id=n.product_id,
                product_name=alert.product.name if alert.product else None,
                retailer_name=n.retailer_name,
                observed_price=n.observed_price,
                target_price=n.target_price,
                channel=n.channel,
                delivery_status=n.delivery_status,
                message=n.message,
                retailer_url=n.retailer_url,
                sent_at=n.sent_at,
            )
        )

    return PriceAlertOut(
        id=alert.id,
        user_id=alert.user_id,
        product_id=alert.product_id,
        product_name=alert.product.name if alert.product else None,
        product_image=alert.product.image_url if alert.product else None,
        target_price=alert.target_price,
        initial_observed_price=alert.initial_observed_price,
        latest_observed_price=alert.latest_observed_price,
        latest_observed_retailer=alert.latest_observed_retailer,
        notification_channel=alert.notification_channel,
        notification_target=alert.notification_target,
        status=alert.status,
        notification_status=alert.notification_status,
        is_active=alert.is_active,
        last_checked_at=alert.last_checked_at,
        triggered_at=alert.triggered_at,
        created_at=alert.created_at,
        notifications=notif_outs,
    )


@router.get("/products")
def list_comparable_products(
    q: Optional[str] = Query(None, description="Search product name, brand, or model"),
    category: Optional[str] = Query(None, description="Filter by category name"),
    limit: int = Query(24, ge=1, le=60),
    db: Session = Depends(get_db),
):
    """
    Lists products that have multi-retailer comparison data with their current lowest retailer price.
    """
    query = db.query(Product)
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(
            (Product.name.ilike(term))
            | (Product.brand.ilike(term))
            | (Product.description.ilike(term))
        )

    products = query.order_by(Product.is_featured.desc(), Product.rating.desc()).all()

    results = []
    for p in products:
        if category and p.category and category.lower() not in p.category.name.lower():
            continue

        listings = db.query(RetailerProduct).filter(RetailerProduct.product_id == p.id).all()
        if not listings:
            continue

        best = min(listings, key=lambda r: r.current_price + (r.delivery_charge or 0.0))
        highest = max(listings, key=lambda r: r.current_price + (r.delivery_charge or 0.0))
        results.append({
            "id": p.id,
            "name": p.name,
            "slug": p.slug,
            "brand": p.brand,
            "model_number": generate_model_number(p),
            "category": p.category.name if p.category else "Catalog",
            "image_url": p.image_url,
            "rating": p.rating,
            "review_count": p.review_count,
            "lowest_retailer_price": best.current_price,
            "lowest_retailer_name": best.retailer_name,
            "highest_retailer_price": highest.current_price,
            "max_savings": round(max(0.0, highest.current_price - best.current_price), 2),
            "retailer_count": len(listings),
            "contains_simulated_data": any(r.is_simulated for r in listings),
        })
        if len(results) >= limit:
            break

    return {
        "total": len(results),
        "items": results,
        "adapter_statuses": retailer_comparison_service.get_adapter_statuses(),
    }


@router.get("/compare", response_model=PriceComparisonResponse)
def compare_multi_platform_prices(
    product_id: Optional[int] = Query(None),
    q: Optional[str] = Query(None, description="Product search query"),
    brand: Optional[str] = Query(None),
    model: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Compares prices across Amazon India, Flipkart, Croma, and Reliance Digital for an exact product model.
    Clearly labels reference simulated adapter feeds vs live affiliate APIs.
    """
    product = retailer_comparison_service.find_matching_product(
        db=db,
        product_id=product_id,
        query=q,
        brand=brand,
        model=model,
    )
    if not product:
        raise HTTPException(
            status_code=404,
            detail="No matching product found across retailer comparison feeds.",
        )

    return retailer_comparison_service.compare_product_prices(product, db)


@router.get("/price-history/{product_id}")
def get_product_price_history(product_id: int, db: Session = Depends(get_db)):
    """
    Returns historical timestamped price observations, min/max/latest metrics,
    Recharts chart series, and price trend insights.
    """
    summary = price_alert_service.get_price_history_summary(db, product_id)
    if not summary:
        raise HTTPException(status_code=404, detail="Product not found")
    return summary


@router.post("/price-history/{product_id}/record")
def record_price_observation_endpoint(
    product_id: int,
    req: RecordPriceRequest,
    db: Session = Depends(get_db),
):
    """
    Saves a new price observation into price_history and runs active alert checks for the product.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    retailer_product_id = req.retailer_product_id
    if not retailer_product_id:
        rp = (
            db.query(RetailerProduct)
            .filter(
                RetailerProduct.product_id == product_id,
                RetailerProduct.retailer_name.ilike(f"%{req.retailer_name}%"),
            )
            .first()
        )
        if rp:
            retailer_product_id = rp.id

    entry = price_alert_service.record_price_observation(
        db=db,
        product_id=product_id,
        retailer_name=req.retailer_name,
        price=req.price,
        original_price=req.original_price,
        retailer_product_id=retailer_product_id,
        is_simulated=req.is_simulated,
    )

    # Check active alerts linked to this product
    active_alerts = (
        db.query(PriceAlert)
        .filter(
            PriceAlert.product_id == product_id,
            PriceAlert.is_active == True,
            PriceAlert.status == "active",
        )
        .all()
    )
    triggered_alerts = []
    for alert in active_alerts:
        notif = price_alert_service.evaluate_alert(db, alert)
        if notif:
            triggered_alerts.append(alert.id)

    return {
        "recorded_id": entry.id,
        "product_id": product_id,
        "retailer_name": entry.retailer_name,
        "price": entry.price,
        "recorded_at": entry.recorded_at,
        "triggered_alert_ids": triggered_alerts,
    }


@router.get("/alerts", response_model=List[PriceAlertOut])
def get_user_price_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves all price drop alerts and notification delivery logs for the signed-in customer.
    """
    alerts = (
        db.query(PriceAlert)
        .filter(PriceAlert.user_id == current_user.id)
        .order_by(desc(PriceAlert.created_at))
        .all()
    )
    return [_serialize_alert(a) for a in alerts]


@router.post("/alerts", response_model=PriceAlertOut)
def create_price_alert(
    req: PriceAlertCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates a new target-price drop alert for a product. Immediately evaluates whether the
    current best retailer price already satisfies the target price.
    """
    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if req.notification_channel not in ("email", "aws_sns", "in_app"):
        raise HTTPException(status_code=400, detail="Unsupported notification channel")

    best = price_alert_service.get_current_best_offer_for_product(db, req.product_id)

    alert = PriceAlert(
        user_id=current_user.id,
        product_id=req.product_id,
        target_price=req.target_price,
        initial_observed_price=best["price"],
        latest_observed_price=best["price"],
        latest_observed_retailer=best["retailer_name"],
        notification_channel=req.notification_channel,
        notification_target=req.notification_target or current_user.email,
        status="active",
        notification_status="pending",
        is_active=True,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    # Evaluate immediately in case current lowest price already hits target
    price_alert_service.evaluate_alert(db, alert)
    db.refresh(alert)
    return _serialize_alert(alert)


@router.patch("/alerts/{alert_id}", response_model=PriceAlertOut)
def update_price_alert(
    alert_id: int,
    req: PriceAlertUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    alert = (
        db.query(PriceAlert)
        .filter(PriceAlert.id == alert_id, PriceAlert.user_id == current_user.id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Price alert not found")

    if req.target_price is not None:
        alert.target_price = req.target_price
        alert.status = "active"
        alert.notification_status = "pending"
    if req.is_active is not None:
        alert.is_active = req.is_active
        if not req.is_active:
            alert.status = "paused"
        elif alert.status == "paused":
            alert.status = "active"
    if req.notification_channel is not None:
        alert.notification_channel = req.notification_channel
    if req.notification_target is not None:
        alert.notification_target = req.notification_target

    db.commit()
    db.refresh(alert)

    if alert.is_active and alert.status == "active":
        price_alert_service.evaluate_alert(db, alert)
        db.refresh(alert)

    return _serialize_alert(alert)


@router.delete("/alerts/{alert_id}")
def delete_price_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    alert = (
        db.query(PriceAlert)
        .filter(PriceAlert.id == alert_id, PriceAlert.user_id == current_user.id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Price alert not found")

    db.delete(alert)
    db.commit()
    return {"deleted": True, "alert_id": alert_id}


@router.post("/alerts/check-now")
def trigger_price_check_now(
    simulate_drop_alert_id: Optional[int] = Query(
        None,
        description="Optional academic demo parameter to simulate a price drop on a specific alert",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Runs the background price checker synchronously for immediate UI feedback.
    Optionally simulates a price drop on one of the user's alerts for academic demo verification.
    """
    if simulate_drop_alert_id is not None:
        alert = (
            db.query(PriceAlert)
            .filter(PriceAlert.id == simulate_drop_alert_id, PriceAlert.user_id == current_user.id)
            .first()
        )
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found for this user")

        sim_res = price_alert_service.simulate_price_drop_and_check(db, alert.id)
        notif = sim_res.get("notification")
        return {
            "mode": "simulated_price_drop_demo",
            "triggered": sim_res["triggered"],
            "alert_id": alert.id,
            "simulated_new_price": sim_res["simulated_new_price"],
            "target_price": sim_res["target_price"],
            "delivery_status": notif.delivery_status if notif else None,
            "message": notif.message if notif else "No notification triggered",
        }

    summary = price_alert_service.check_all_active_alerts(db)
    return {
        "mode": "standard_price_check",
        **summary,
    }


@router.get("/notifications", response_model=List[PriceAlertNotificationOut])
def get_alert_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lists historical alert notification dispatches for the current user.
    """
    notifs = (
        db.query(PriceAlertNotification)
        .filter(PriceAlertNotification.user_id == current_user.id)
        .order_by(desc(PriceAlertNotification.sent_at))
        .limit(50)
        .all()
    )
    out = []
    for n in notifs:
        out.append(
            PriceAlertNotificationOut(
                id=n.id,
                alert_id=n.alert_id,
                product_id=n.product_id,
                product_name=n.product.name if n.product else None,
                retailer_name=n.retailer_name,
                observed_price=n.observed_price,
                target_price=n.target_price,
                channel=n.channel,
                delivery_status=n.delivery_status,
                message=n.message,
                retailer_url=n.retailer_url,
                sent_at=n.sent_at,
            )
        )
    return out


@router.post("/validate-url")
def validate_retailer_url_endpoint(req: UrlValidationRequest):
    """
    Verifies whether a retailer URL passes Snap2Price HTTPS & trusted-domain validation.
    """
    return validate_retailer_url(req.url)
