import hashlib
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.user import User
from app.models.snap2price import (
    RetailerProduct,
    PriceHistory,
    PriceAlert,
    PriceAlertNotification,
)
from app.services.retailer_adapter import (
    generate_model_number,
    build_retailer_search_url,
)

RETAILERS = [
    {
        "name": "Amazon India",
        "slug": "amazon",
        "delivery_estimate": "FREE Delivery by Tomorrow with Prime",
    },
    {
        "name": "Flipkart",
        "slug": "flipkart",
        "delivery_estimate": "Free Assured Delivery in 2 Days",
    },
    {
        "name": "Croma",
        "slug": "croma",
        "delivery_estimate": "Express Store Pickup or 2-Day Delivery",
    },
    {
        "name": "Reliance Digital",
        "slug": "reliance_digital",
        "delivery_estimate": "Standard Delivery in 2-3 Days",
    },
]


def _deterministic_factor(product_id: int, salt: str) -> float:
    h = hashlib.md5(f"{product_id}:{salt}".encode()).hexdigest()
    return int(h[:4], 16) / 65535.0  # 0.0 to 1.0


def seed_snap2price_data(db: Session) -> None:
    """
    Idempotently seeds multi-retailer listings, 30-day price history observations,
    and sample price drop alerts for academic Snap2Price demonstration.
    Always marks synthetic seed feeds with is_simulated=True.
    """
    products = db.query(Product).all()
    if not products:
        return

    existing_rp_product_ids = {
        row[0] for row in db.query(RetailerProduct.product_id).distinct().all()
    }

    now = datetime.utcnow()
    new_listings = []

    for product in products:
        if product.id in existing_rp_product_ids:
            continue

        model_num = generate_model_number(product)
        base_price = float(product.price)
        mrp = float(product.original_price) if product.original_price and product.original_price > base_price else round(base_price * 1.12, -1)

        # Deterministic offsets so one retailer clearly wins as best deal (~4-9% spread)
        offsets = []
        for idx, r in enumerate(RETAILERS):
            rand = _deterministic_factor(product.id, r["slug"])
            # Vary between -4% and +6% around base catalog price
            pct_shift = -0.04 + (rand * 0.10)
            offer_price = round((base_price * (1.0 + pct_shift)) / 10.0) * 10.0
            offer_price = max(299.0, float(offer_price))
            offsets.append((idx, r, offer_price))

        for idx, r, offer_price in offsets:
            delivery_fee = 0.0
            if offer_price < 1500.0 and r["slug"] in ("croma", "reliance_digital"):
                delivery_fee = 99.0

            rating_shift = round((_deterministic_factor(product.id, f"rat-{idx}") - 0.5) * 0.3, 1)
            ret_rating = round(min(5.0, max(3.8, float(product.rating) + rating_shift)), 1)
            ret_reviews = max(12, int(product.review_count * (0.6 + _deterministic_factor(product.id, f"rev-{idx}") * 1.2)))
            discount_pct = round(((mrp - offer_price) / mrp) * 100.0, 1) if mrp > offer_price else 0.0

            rp = RetailerProduct(
                product_id=product.id,
                retailer_name=r["name"],
                retailer_slug=r["slug"],
                brand=product.brand,
                model_number=model_num,
                product_name=product.name,
                specifications=product.specifications,
                image_url=product.image_url,
                current_price=offer_price,
                original_price=mrp,
                discount_percentage=discount_pct,
                delivery_charge=delivery_fee,
                delivery_estimate=r["delivery_estimate"],
                rating=ret_rating,
                review_count=ret_reviews,
                product_url=build_retailer_search_url(r["slug"], product.name, model_num),
                in_stock=True,
                data_source="reference_mock_adapter",
                is_simulated=True,
                last_updated=now,
            )
            db.add(rp)
            new_listings.append((product, rp))

    if new_listings:
        db.commit()
        for _, rp in new_listings:
            db.refresh(rp)

        # Generate 30-day historical price observations (6 checkpoints per retailer)
        history_days = [30, 24, 18, 12, 6, 0]
        for product, rp in new_listings:
            for d_idx, days_ago in enumerate(history_days):
                ts = now - timedelta(days=days_ago)
                if days_ago == 0:
                    hist_price = rp.current_price
                else:
                    wave = _deterministic_factor(product.id + d_idx, f"hist-{rp.retailer_slug}-{days_ago}")
                    # Slightly higher historical price on average so current/recent deals look interesting
                    hist_shift = -0.02 + (wave * 0.11)
                    hist_price = round((rp.current_price * (1.0 + hist_shift)) / 10.0) * 10.0
                    hist_price = max(299.0, float(hist_price))

                db.add(
                    PriceHistory(
                        product_id=product.id,
                        retailer_product_id=rp.id,
                        retailer_name=rp.retailer_name,
                        price=hist_price,
                        original_price=rp.original_price,
                        currency="INR",
                        is_simulated=True,
                        recorded_at=ts,
                    )
                )
        db.commit()

    # Create sample price alerts for Demo Customer if they have none
    demo_user = db.query(User).filter(User.email == "demo@shopsmart.ai").first()
    if demo_user and db.query(PriceAlert).filter(PriceAlert.user_id == demo_user.id).count() == 0:
        sample_prods = db.query(Product).order_by(Product.id.asc()).limit(2).all()
        if len(sample_prods) >= 1:
            p1 = sample_prods[0]
            p1_listings = db.query(RetailerProduct).filter(RetailerProduct.product_id == p1.id).all()
            best_p1 = min(p1_listings, key=lambda x: x.current_price) if p1_listings else None
            curr_p1 = best_p1.current_price if best_p1 else p1.price
            target_p1 = round(curr_p1 * 0.90, -2)  # 10% below current best -> waiting active alert

            alert_active = PriceAlert(
                user_id=demo_user.id,
                product_id=p1.id,
                target_price=target_p1,
                initial_observed_price=curr_p1,
                latest_observed_price=curr_p1,
                latest_observed_retailer=best_p1.retailer_name if best_p1 else "Amazon India",
                notification_channel="email",
                notification_target=demo_user.email,
                status="active",
                notification_status="pending",
                is_active=True,
                last_checked_at=now,
            )
            db.add(alert_active)

        if len(sample_prods) >= 2:
            p2 = sample_prods[1]
            p2_listings = db.query(RetailerProduct).filter(RetailerProduct.product_id == p2.id).all()
            best_p2 = min(p2_listings, key=lambda x: x.current_price) if p2_listings else None
            curr_p2 = best_p2.current_price if best_p2 else p2.price
            target_p2 = round(curr_p2 + 1500.0, -2)

            alert_triggered = PriceAlert(
                user_id=demo_user.id,
                product_id=p2.id,
                target_price=target_p2,
                initial_observed_price=curr_p2 + 3000.0,
                latest_observed_price=curr_p2,
                latest_observed_retailer=best_p2.retailer_name if best_p2 else "Flipkart",
                notification_channel="email",
                notification_target=demo_user.email,
                status="triggered",
                notification_status="simulated_delivered",
                is_active=True,
                last_checked_at=now,
                triggered_at=now - timedelta(hours=2),
            )
            db.add(alert_triggered)
            db.commit()
            db.refresh(alert_triggered)

            db.add(
                PriceAlertNotification(
                    alert_id=alert_triggered.id,
                    user_id=demo_user.id,
                    product_id=p2.id,
                    retailer_name=best_p2.retailer_name if best_p2 else "Flipkart",
                    observed_price=curr_p2,
                    target_price=target_p2,
                    channel="email",
                    delivery_status="simulated_delivered",
                    message=(
                        f"Great news! '{p2.name}' dropped to ₹{curr_p2:,.0f} on "
                        f"{best_p2.retailer_name if best_p2 else 'Flipkart'}, beating your target of ₹{target_p2:,.0f}. "
                        "[Recorded simulated email alert notification]"
                    ),
                    retailer_url=best_p2.product_url if best_p2 else None,
                    sent_at=now - timedelta(hours=2),
                )
            )
        db.commit()
