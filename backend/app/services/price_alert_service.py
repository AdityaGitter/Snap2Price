import logging
import smtplib
from email.message import EmailMessage
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import asc

from app.config import settings
from app.models.product import Product
from app.models.user import User
from app.models.snap2price import (
    RetailerProduct,
    PriceHistory,
    PriceAlert,
    PriceAlertNotification,
)
from app.services.retailer_adapter import build_retailer_search_url

logger = logging.getLogger("shopsmart.price_alerts")


class NotificationDispatcher:
    """
    Delivers price-drop notifications via configured external provider
    (Email SMTP or AWS SNS), or falls back transparently to simulated
    in-app notification delivery logs for academic evaluation.
    """

    def send_notification(
        self,
        channel: str,
        target: Optional[str],
        subject: str,
        body: str,
    ) -> Dict[str, Any]:
        # 1. Try AWS SNS if requested and configured
        if channel == "aws_sns" and settings.AWS_SNS_TOPIC_ARN:
            try:
                import boto3
                sns_client = boto3.client("sns", region_name=settings.AWS_REGION)
                kwargs: Dict[str, Any] = {
                    "Message": body,
                    "Subject": subject[:100],
                }
                if target and target.startswith("+"):
                    kwargs["PhoneNumber"] = target
                else:
                    kwargs["TopicArn"] = settings.AWS_SNS_TOPIC_ARN

                resp = sns_client.publish(**kwargs)
                return {
                    "delivery_status": "sent_aws_sns",
                    "external_id": resp.get("MessageId"),
                    "detail": "Delivered via AWS SNS",
                }
            except Exception as e:
                logger.warning(f"AWS SNS dispatch failed, recording simulated fallback: {e}")

        # 2. Try Email SMTP if requested and configured
        if channel == "email" and settings.SMTP_HOST and settings.SMTP_USER and target:
            try:
                msg = EmailMessage()
                msg["Subject"] = subject
                msg["From"] = settings.SMTP_FROM_EMAIL
                msg["To"] = target
                msg.set_content(body)

                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                    server.starttls()
                    if settings.SMTP_PASSWORD:
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.send_message(msg)

                return {
                    "delivery_status": "sent_smtp",
                    "external_id": f"smtp-{datetime.utcnow().timestamp()}",
                    "detail": f"Email sent to {target} via {settings.SMTP_HOST}",
                }
            except Exception as e:
                logger.warning(f"SMTP dispatch failed, recording simulated fallback: {e}")

        # 3. Transparent Academic Simulation Fallback (never claims real external delivery)
        return {
            "delivery_status": "simulated_delivered",
            "external_id": f"sim-notif-{int(datetime.utcnow().timestamp())}",
            "detail": (
                f"Recorded simulated {channel} alert notification (configure SMTP_* or AWS_SNS_TOPIC_ARN for live external dispatch)"
            ),
        }


dispatcher = NotificationDispatcher()


class PriceHistoryAndAlertService:
    """
    Manages timestamped price observations, historical trend calculations,
    automated target-price monitoring, and price-drop alert delivery.
    """

    def record_price_observation(
        self,
        db: Session,
        product_id: int,
        retailer_name: str,
        price: float,
        original_price: Optional[float] = None,
        retailer_product_id: Optional[int] = None,
        is_simulated: bool = True,
        recorded_at: Optional[datetime] = None,
    ) -> PriceHistory:
        entry = PriceHistory(
            product_id=product_id,
            retailer_product_id=retailer_product_id,
            retailer_name=retailer_name,
            price=float(price),
            original_price=float(original_price) if original_price else None,
            currency="INR",
            is_simulated=is_simulated,
            recorded_at=recorded_at or datetime.utcnow(),
        )
        db.add(entry)

        # Also update the linked retailer listing's latest observed price if referenced
        if retailer_product_id:
            rp = db.query(RetailerProduct).filter(RetailerProduct.id == retailer_product_id).first()
            if rp:
                rp.current_price = float(price)
                if original_price and original_price > price:
                    rp.original_price = float(original_price)
                    rp.discount_percentage = round(((original_price - price) / original_price) * 100, 1)
                rp.last_updated = recorded_at or datetime.utcnow()

        db.commit()
        db.refresh(entry)
        return entry

    def get_price_history_summary(self, db: Session, product_id: int) -> Dict[str, Any]:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return {}

        history_rows = (
            db.query(PriceHistory)
            .filter(PriceHistory.product_id == product_id)
            .order_by(asc(PriceHistory.recorded_at))
            .all()
        )

        retailer_listings = (
            db.query(RetailerProduct)
            .filter(RetailerProduct.product_id == product_id)
            .order_by(RetailerProduct.current_price.asc())
            .all()
        )

        # If no historical entries yet, seed an initial snapshot from current listings
        if not history_rows and retailer_listings:
            for rp in retailer_listings:
                self.record_price_observation(
                    db=db,
                    product_id=product_id,
                    retailer_name=rp.retailer_name,
                    price=rp.current_price,
                    original_price=rp.original_price,
                    retailer_product_id=rp.id,
                    is_simulated=rp.is_simulated,
                )
            history_rows = (
                db.query(PriceHistory)
                .filter(PriceHistory.product_id == product_id)
                .order_by(asc(PriceHistory.recorded_at))
                .all()
            )

        prices = [h.price for h in history_rows]
        lowest_row = min(history_rows, key=lambda h: h.price) if history_rows else None
        highest_row = max(history_rows, key=lambda h: h.price) if history_rows else None
        latest_row = history_rows[-1] if history_rows else None

        lowest_price = lowest_row.price if lowest_row else product.price
        highest_price = highest_row.price if highest_row else (product.original_price or product.price)

        # Current lowest across retailers if available
        current_best_listing = retailer_listings[0] if retailer_listings else None
        latest_price = current_best_listing.current_price if current_best_listing else (latest_row.price if latest_row else product.price)
        latest_retailer = current_best_listing.retailer_name if current_best_listing else (latest_row.retailer_name if latest_row else "ShopSmart Catalog")

        avg_price = round(sum(prices) / len(prices), 2) if prices else latest_price

        # Build Recharts multi-series dataset grouped by date string
        date_buckets: Dict[str, Dict[str, Any]] = {}
        retailers_seen = set()
        for row in history_rows:
            date_key = row.recorded_at.strftime("%b %d")
            retailers_seen.add(row.retailer_name)
            if date_key not in date_buckets:
                date_buckets[date_key] = {
                    "date": date_key,
                    "timestamp": row.recorded_at.isoformat(),
                    "_prices": [],
                }
            date_buckets[date_key][row.retailer_name] = row.price
            date_buckets[date_key]["_prices"].append(row.price)

        chart_data: List[Dict[str, Any]] = []
        for _, bucket in date_buckets.items():
            day_prices = bucket.pop("_prices")
            bucket["lowest_market_price"] = min(day_prices) if day_prices else None
            chart_data.append(bucket)

        # Trend analysis comparing latest price against historical average and earliest entry
        first_price = prices[0] if prices else latest_price
        change_pct = round(((latest_price - first_price) / first_price) * 100, 1) if first_price > 0 else 0.0
        if change_pct <= -2.0:
            trend_direction = "dropping"
            trend_summary = f"Price is trending downward ({abs(change_pct)}% lower than initial observation). Great time to buy!"
        elif change_pct >= 2.0:
            trend_direction = "rising"
            trend_summary = f"Price has increased by {change_pct}% over the tracked period. Setting a target alert is recommended."
        else:
            trend_direction = "stable"
            trend_summary = "Price has remained relatively stable across major retailers."

        return {
            "product": {
                "id": product.id,
                "name": product.name,
                "slug": product.slug,
                "brand": product.brand,
                "image_url": product.image_url,
                "current_best_price": latest_price,
                "best_retailer": latest_retailer,
            },
            "statistics": {
                "lowest_recorded_price": lowest_price,
                "lowest_recorded_retailer": lowest_row.retailer_name if lowest_row else latest_retailer,
                "lowest_recorded_at": lowest_row.recorded_at if lowest_row else None,
                "highest_recorded_price": highest_price,
                "highest_recorded_retailer": highest_row.retailer_name if highest_row else latest_retailer,
                "highest_recorded_at": highest_row.recorded_at if highest_row else None,
                "latest_recorded_price": latest_price,
                "latest_recorded_retailer": latest_retailer,
                "average_price": avg_price,
                "total_observations": len(history_rows),
                "trend_direction": trend_direction,
                "price_change_percent": change_pct,
                "trend_summary": trend_summary,
                "is_all_time_low": latest_price <= lowest_price,
            },
            "retailers": sorted(list(retailers_seen)),
            "chart_data": chart_data,
            "history_records": [
                {
                    "id": r.id,
                    "retailer_name": r.retailer_name,
                    "price": r.price,
                    "original_price": r.original_price,
                    "currency": r.currency,
                    "is_simulated": r.is_simulated,
                    "recorded_at": r.recorded_at,
                }
                for r in reversed(history_rows[-40:])
            ],
            "contains_simulated_data": any(r.is_simulated for r in history_rows) if history_rows else True,
        }

    def get_current_best_offer_for_product(self, db: Session, product_id: int) -> Dict[str, Any]:
        listings = (
            db.query(RetailerProduct)
            .filter(RetailerProduct.product_id == product_id, RetailerProduct.in_stock == True)
            .all()
        )
        if listings:
            best = min(listings, key=lambda r: r.current_price + (r.delivery_charge or 0.0))
            return {
                "price": best.current_price,
                "retailer_name": best.retailer_name,
                "product_url": best.product_url,
                "retailer_product_id": best.id,
            }
        product = db.query(Product).filter(Product.id == product_id).first()
        return {
            "price": product.price if product else 0.0,
            "retailer_name": "ShopSmart Catalog",
            "product_url": build_retailer_search_url("amazon", product.name, "") if product else "",
            "retailer_product_id": None,
        }

    def evaluate_alert(self, db: Session, alert: PriceAlert) -> Optional[PriceAlertNotification]:
        """
        Evaluates a single alert against latest observed retailer price.
        Creates notification if target price threshold is reached.
        """
        best_offer = self.get_current_best_offer_for_product(db, alert.product_id)
        observed_price = best_offer["price"]
        retailer_name = best_offer["retailer_name"]
        now = datetime.utcnow()

        alert.latest_observed_price = observed_price
        alert.latest_observed_retailer = retailer_name
        alert.last_checked_at = now

        if observed_price <= alert.target_price and alert.status != "triggered":
            product = db.query(Product).filter(Product.id == alert.product_id).first()
            user = db.query(User).filter(User.id == alert.user_id).first()
            target_dest = alert.notification_target or (user.email if user else None)

            subject = f"Snap2Price Alert: {product.name if product else 'Tracked Item'} dropped to ₹{observed_price:,.0f}!"
            message = (
                f"Great news! '{product.name if product else 'Product'}' is now available for "
                f"₹{observed_price:,.0f} on {retailer_name}, beating your target price of ₹{alert.target_price:,.0f}."
            )

            dispatch_res = dispatcher.send_notification(
                channel=alert.notification_channel,
                target=target_dest,
                subject=subject,
                body=message,
            )

            alert.status = "triggered"
            alert.triggered_at = now
            alert.notification_status = dispatch_res["delivery_status"]

            notif = PriceAlertNotification(
                alert_id=alert.id,
                user_id=alert.user_id,
                product_id=alert.product_id,
                retailer_name=retailer_name,
                observed_price=observed_price,
                target_price=alert.target_price,
                channel=alert.notification_channel,
                delivery_status=dispatch_res["delivery_status"],
                message=f"{message} [{dispatch_res['detail']}]",
                retailer_url=best_offer["product_url"],
                sent_at=now,
            )
            db.add(notif)
            db.commit()
            db.refresh(alert)
            db.refresh(notif)
            return notif

        db.commit()
        db.refresh(alert)
        return None

    def check_all_active_alerts(self, db: Session) -> Dict[str, Any]:
        """
        Background job entrypoint: evaluates every active price alert in the database.
        """
        active_alerts = (
            db.query(PriceAlert)
            .filter(PriceAlert.is_active == True, PriceAlert.status == "active")
            .all()
        )
        triggered_count = 0
        notifications_created: List[PriceAlertNotification] = []

        for alert in active_alerts:
            notif = self.evaluate_alert(db, alert)
            if notif:
                triggered_count += 1
                notifications_created.append(notif)

        return {
            "checked_alerts": len(active_alerts),
            "triggered_count": triggered_count,
            "notifications_sent": len(notifications_created),
            "checked_at": datetime.utcnow().isoformat(),
        }

    def simulate_price_drop_and_check(self, db: Session, alert_id: int) -> Dict[str, Any]:
        """
        Academic demo helper: simulates a retailer price drop slightly below the customer's
        target price, records it in price_history, and runs alert detection immediately.
        """
        alert = db.query(PriceAlert).filter(PriceAlert.id == alert_id).first()
        if not alert:
            return {"triggered": False, "error": "Alert not found"}

        # Reset alert to active if previously paused/triggered so demo can re-run cleanly
        alert.status = "active"
        alert.is_active = True
        alert.notification_status = "pending"
        db.commit()

        # Find best retailer listing to apply simulated drop
        listing = (
            db.query(RetailerProduct)
            .filter(RetailerProduct.product_id == alert.product_id)
            .order_by(RetailerProduct.current_price.asc())
            .first()
        )
        dropped_price = round(max(100.0, alert.target_price - 500.0), 2)
        if dropped_price > alert.target_price:
            dropped_price = alert.target_price

        if listing:
            self.record_price_observation(
                db=db,
                product_id=alert.product_id,
                retailer_name=listing.retailer_name,
                price=dropped_price,
                original_price=listing.original_price,
                retailer_product_id=listing.id,
                is_simulated=True,
            )
        else:
            self.record_price_observation(
                db=db,
                product_id=alert.product_id,
                retailer_name="Amazon India",
                price=dropped_price,
                is_simulated=True,
            )

        notif = self.evaluate_alert(db, alert)
        return {
            "triggered": notif is not None,
            "alert_id": alert.id,
            "simulated_new_price": dropped_price,
            "target_price": alert.target_price,
            "notification": notif,
        }


price_alert_service = PriceHistoryAndAlertService()
