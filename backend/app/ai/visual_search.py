import base64
import json
import logging
import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.product import Product, Category
from app.ai.gemini_service import gemini_service
from app.services.retailer_adapter import retailer_comparison_service

logger = logging.getLogger("shopsmart.visual_search")


def _extract_hint_metadata(description_hint: str, db: Session) -> Dict[str, Any]:
    """
    Deterministic metadata-similarity helper when multimodal vision is unavailable.
    Never claims image pixel understanding.
    """
    hint_lower = (description_hint or "").lower()
    detected_category = "Electronics"
    p_type = "electronic device"
    matched_brand: Optional[str] = None
    matched_model: Optional[str] = None
    matched_name: Optional[str] = None
    extracted_specs: Dict[str, Any] = {}

    if "laptop" in hint_lower or "macbook" in hint_lower or "ultrabook" in hint_lower or "computer" in hint_lower or "xps" in hint_lower or "rog" in hint_lower:
        detected_category = "Laptops & Computing"
        p_type = "laptop"
    elif "headphone" in hint_lower or "earbud" in hint_lower or "airpods" in hint_lower or "phone" in hint_lower or "iphone" in hint_lower or "galaxy" in hint_lower or "oneplus" in hint_lower or "audio" in hint_lower:
        detected_category = "Smartphones & Audio"
        p_type = "headphone" if ("headphone" in hint_lower or "earbud" in hint_lower or "audio" in hint_lower) else "smartphone"
    elif "shoe" in hint_lower or "sneaker" in hint_lower or "dress" in hint_lower or "shirt" in hint_lower or "jacket" in hint_lower:
        detected_category = "Fashion & Apparel"
        p_type = "apparel / footwear"
    elif "kitchen" in hint_lower or "coffee" in hint_lower or "espresso" in hint_lower or "air fryer" in hint_lower:
        detected_category = "Home & Kitchen"
        p_type = "kitchen appliance"
    elif "watch" in hint_lower or "fitness" in hint_lower or "theragun" in hint_lower or "mat" in hint_lower:
        detected_category = "Fitness & Lifestyle"
        p_type = "smartwatch / fitness gear"

    # Match against catalog tokens from hint text
    matched_product = retailer_comparison_service.find_matching_product(
        db=db, query=description_hint, category=detected_category
    )
    if matched_product:
        matched_brand = matched_product.brand
        matched_name = matched_product.name
        matched_model = matched_product.name
        if matched_product.specifications:
            try:
                extracted_specs = json.loads(matched_product.specifications)
            except Exception:
                extracted_specs = {}

    return {
        "category": detected_category,
        "brand": matched_brand,
        "model": matched_model,
        "product_name": matched_name or description_hint or "Unspecified Item",
        "product_type": p_type,
        "visual_attributes": ["Matched from text hint / metadata only (no image pixels processed)"],
        "specifications": extracted_specs,
        "search_keywords": [w for w in re.split(r"[^a-zA-Z0-9]+", description_hint or "") if len(w) > 2][:6],
        "visual_description": (
            f"Matched via text/metadata similarity using hint: '{description_hint}'."
            if description_hint
            else "No text hint provided; showing top catalog items."
        ),
    }


def search_by_image(
    image_base64: Optional[str],
    image_url: Optional[str],
    description_hint: Optional[str],
    db: Session,
) -> Dict[str, Any]:
    search_method = "metadata_similarity_fallback"
    ai_vision_used = False
    method_explanation = (
        "Results were matched using text/metadata similarity rather than image understanding "
        "because Gemini multimodal vision is not configured or no analyzable image payload was received."
    )
    detected_attributes: Dict[str, Any] = {}
    matched_category_name: Optional[str] = None
    confidence = 0.72

    img_bytes: Optional[bytes] = None
    mime = "image/jpeg"

    # Prepare binary image bytes if provided
    if image_base64 and gemini_service.is_available():
        try:
            raw_b64 = image_base64
            if "," in raw_b64:
                header, raw_b64 = raw_b64.split(",", 1)
                if "image/png" in header:
                    mime = "image/png"
                elif "image/webp" in header:
                    mime = "image/webp"
            img_bytes = base64.b64decode(raw_b64)
        except Exception as e:
            logger.warning(f"Failed to decode base64 image payload: {e}")
            img_bytes = None
    elif image_url and gemini_service.is_available() and image_url.startswith("https://"):
        try:
            import requests
            resp = requests.get(image_url, timeout=4)
            if resp.status_code == 200 and resp.content:
                img_bytes = resp.content
                ct = resp.headers.get("Content-Type", "")
                if "png" in ct:
                    mime = "image/png"
                elif "webp" in ct:
                    mime = "image/webp"
        except Exception as e:
            logger.warning(f"Could not fetch image_url for Gemini Vision: {e}")
            img_bytes = None

    # 1. Execute genuine Gemini Multimodal Vision analysis when image bytes & API key are available
    if img_bytes and gemini_service.is_available():
        try:
            analysis = gemini_service.analyze_image_for_search(img_bytes, mime_type=mime)
            if analysis and isinstance(analysis, dict) and analysis.get("category"):
                detected_attributes = analysis
                matched_category_name = analysis.get("category")
                search_method = "gemini_multimodal_vision"
                ai_vision_used = True
                confidence = 0.94
                method_explanation = (
                    f"Analyzed uploaded image pixels using Google Gemini ({gemini_service.model_name}) "
                    "to identify category, brand, model, visual attributes, and specifications."
                )
        except Exception as e:
            logger.warning(f"Gemini vision failed: {e}")

    # 2. Honest Metadata Fallback when multimodal vision was not executed
    if not detected_attributes:
        detected_attributes = _extract_hint_metadata(description_hint or "", db)
        matched_category_name = detected_attributes.get("category")
        search_method = "metadata_similarity_fallback"
        ai_vision_used = False
        confidence = 0.78 if description_hint else 0.55

    # 3. Search catalog products prioritized by extracted Brand, Model, Product Name, and Category
    matched_products: List[Product] = []
    seen_ids = set()

    primary_match = retailer_comparison_service.find_matching_product(
        db=db,
        query=detected_attributes.get("product_name") or description_hint,
        brand=detected_attributes.get("brand"),
        model=detected_attributes.get("model"),
        category=matched_category_name,
    )
    if primary_match:
        matched_products.append(primary_match)
        seen_ids.add(primary_match.id)

    # Also add closely related items in the matched category
    query = db.query(Product)
    if matched_category_name:
        category = db.query(Category).filter(Category.name.ilike(f"%{matched_category_name}%")).first()
        if category:
            query = query.filter(Product.category_id == category.id)

    for p in query.order_by(Product.rating.desc()).limit(8).all():
        if p.id not in seen_ids:
            matched_products.append(p)
            seen_ids.add(p.id)
        if len(matched_products) >= 8:
            break

    if not matched_products:
        matched_products = db.query(Product).order_by(Product.rating.desc()).limit(8).all()

    # 4. Feed identified product into Retailer Price Comparison service (Snap2Price flow)
    retailer_comparison = None
    if matched_products:
        retailer_comparison = retailer_comparison_service.compare_product_prices(matched_products[0], db)

    return {
        "detected_attributes": detected_attributes,
        "matched_category": matched_category_name,
        "identified_product": {
            "category": matched_category_name,
            "brand": detected_attributes.get("brand"),
            "model": detected_attributes.get("model"),
            "product_name": detected_attributes.get("product_name"),
            "visual_attributes": detected_attributes.get("visual_attributes") or detected_attributes.get("key_features") or [],
            "specifications": detected_attributes.get("specifications") or {},
        },
        "confidence_score": confidence,
        "matched_products": matched_products,
        "search_method": search_method,
        "ai_vision_used": ai_vision_used,
        "method_explanation": method_explanation,
        "retailer_comparison": retailer_comparison,
    }
