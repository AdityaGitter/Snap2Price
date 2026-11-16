from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class RetailerProduct(Base):
    __tablename__ = "retailer_products"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    retailer_name = Column(String(100), nullable=False, index=True)
    retailer_slug = Column(String(50), nullable=False, index=True)
    brand = Column(String(100), nullable=True, index=True)
    model_number = Column(String(120), nullable=False, index=True)
    product_name = Column(String(255), nullable=False)
    specifications = Column(Text, nullable=True)  # JSON key-value pairs for model verification
    image_url = Column(String(500), nullable=False)
    current_price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=True)
    discount_percentage = Column(Float, default=0.0)
    delivery_charge = Column(Float, default=0.0)
    delivery_estimate = Column(String(120), nullable=True)
    rating = Column(Float, nullable=True)
    review_count = Column(Integer, default=0)
    product_url = Column(String(1000), nullable=False)
    in_stock = Column(Boolean, default=True)
    data_source = Column(String(60), default="reference_mock_adapter")
    is_simulated = Column(Boolean, default=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    product = relationship("Product", back_populates="retailer_listings")
    price_history_entries = relationship(
        "PriceHistory", back_populates="retailer_product", cascade="all, delete-orphan"
    )


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    retailer_product_id = Column(Integer, ForeignKey("retailer_products.id"), nullable=True, index=True)
    retailer_name = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=True)
    currency = Column(String(10), default="INR")
    is_simulated = Column(Boolean, default=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    product = relationship("Product", back_populates="price_history_entries")
    retailer_product = relationship("RetailerProduct", back_populates="price_history_entries")


class PriceAlert(Base):
    __tablename__ = "price_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    target_price = Column(Float, nullable=False)
    initial_observed_price = Column(Float, nullable=True)
    latest_observed_price = Column(Float, nullable=True)
    latest_observed_retailer = Column(String(100), nullable=True)
    notification_channel = Column(String(50), default="email")  # email | aws_sns | in_app
    notification_target = Column(String(255), nullable=True)
    status = Column(String(30), default="active")  # active | triggered | paused
    notification_status = Column(String(50), default="pending")
    is_active = Column(Boolean, default=True)
    last_checked_at = Column(DateTime, nullable=True)
    triggered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="price_alerts")
    product = relationship("Product", back_populates="price_alerts")
    notifications = relationship(
        "PriceAlertNotification", back_populates="alert", cascade="all, delete-orphan"
    )


class PriceAlertNotification(Base):
    __tablename__ = "price_alert_notifications"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("price_alerts.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    retailer_name = Column(String(100), nullable=False)
    observed_price = Column(Float, nullable=False)
    target_price = Column(Float, nullable=False)
    channel = Column(String(50), nullable=False)
    delivery_status = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    retailer_url = Column(String(1000), nullable=True)
    sent_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    alert = relationship("PriceAlert", back_populates="notifications")
    user = relationship("User", back_populates="alert_notifications")
    product = relationship("Product")
