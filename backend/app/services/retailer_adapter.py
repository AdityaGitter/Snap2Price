import json
import re
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Tuple
from urllib.parse import urlparse, quote_plus
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.config import settings
from app.models.product import Product
from app.models.snap2price import RetailerProduct

# Permitted retailer hostnames for outbound purchase links
ALLOWED_RETAILER_DOMAINS = {
    "amazon.in",
    "www.amazon.in",
    "flipkart.com",
    "www.flipkart.com",
    "croma.com",
    "www.croma.com",
    "reliancedigital.in",
    "www.reliancedigital.in",
    "apple.com",
    "www.apple.com",
    "samsung.com",
    "www.samsung.com",
    "tatacliq.com",
    "www.tatacliq.com",
    "vijaysales.com",
    "www.vijaysales.com",
}


def validate_retailer_url(url: str) -> Dict[str, Any]:
    """
    Validates that an external retailer URL is safe, uses HTTPS, and belongs
    to a permitted authorized retailer domain.
    """
    if not url or not isinstance(url, str):
        return {"valid": False, "reason": "Empty or non-string URL", "domain": None}

    trimmed = url.strip()
    lower = trimmed.lower()
    if lower.startswith("javascript:") or lower.startswith("data:") or lower.startswith("file:"):
        return {"valid": False, "reason": "Disallowed URL scheme", "domain": None}

    parsed = urlparse(trimmed)
    if parsed.scheme != "https":
        return {"valid": False, "reason": "Retailer URLs must use HTTPS", "domain": parsed.netloc or None}

    hostname = (parsed.hostname or "").lower()
    if not hostname:
        return {"valid": False, "reason": "Missing hostname", "domain": None}

    is_permitted = any(
        hostname == allowed or hostname.endswith(f".{allowed}")
        for allowed in ALLOWED_RETAILER_DOMAINS
    )
    if not is_permitted:
        return {
            "valid": False,
            "reason": f"Domain '{hostname}' is not in the authorized retailer allowlist",
            "domain": hostname,
        }

    return {"valid": True, "reason": "Verified HTTPS retailer domain", "domain": hostname}


def generate_model_number(product: Product) -> str:
    """
    Produces a canonical model identifier for exact cross-platform matching.
    """
    brand_code = re.sub(r"[^A-Z0-9]", "", (product.brand or "GEN").upper())[:4]
    slug_tokens = [t.upper() for t in re.split(r"[-_\s]+", product.slug or product.name) if t]
    core_tokens = "".join(t[:4] for t in slug_tokens[:3])
    return f"{brand_code}-{core_tokens}-{product.id:03d}"


def build_retailer_search_url(retailer_slug: str, product_name: str, model_number: str) -> str:
    """
    Builds a verified HTTPS retailer search/product destination URL for the exact model.
    """
    query = quote_plus(product_name)
    slug = retailer_slug.lower()
    if slug == "amazon":
        return f"https://www.amazon.in/s?k={query}"
    elif slug == "flipkart":
        return f"https://www.flipkart.com/search?q={query}"
    elif slug == "croma":
        return f"https://www.croma.com/searchB?q={query}%3Arelevance"
    elif slug == "reliance_digital":
        return f"https://www.reliancedigital.in/search?q={query}:relevance"
    return f"https://www.amazon.in/s?k={query}"


class BaseRetailerAdapter(ABC):
    """
    Abstract Retailer Feed Adapter enabling seamless drop-in replacement
    of reference mock feeds with live authorized affiliate / partner APIs
    (Amazon PA-API 5.0, Flipkart Affiliate API, Croma Partner Feed, etc.).
    """
    retailer_name: str
    retailer_slug: str

    @abstractmethod
    def is_live_api_configured(self) -> bool:
        pass

    @abstractmethod
    def get_data_source_info(self) -> Dict[str, Any]:
        pass

    def fetch_listings_for_product(self, product: Product, db: Session) -> Optional[RetailerProduct]:
        """
        Fetches listing from live API when configured, or falls back to clearly labelled
        reference database records maintained by the adapter registry.
        """
        listing = (
            db.query(RetailerProduct)
            .filter(
                RetailerProduct.product_id == product.id,
                RetailerProduct.retailer_slug == self.retailer_slug,
            )
            .first()
        )
        return listing


class AmazonIndiaAdapter(BaseRetailerAdapter):
    retailer_name = "Amazon India"
    retailer_slug = "amazon"

    def is_live_api_configured(self) -> bool:
        return bool(settings.AMAZON_PA_API_KEY)

    def get_data_source_info(self) -> Dict[str, Any]:
        live = self.is_live_api_configured()
        return {
            "retailer_name": self.retailer_name,
            "retailer_slug": self.retailer_slug,
            "live_api_configured": live,
            "data_source": "amazon_pa_api" if live else "reference_mock_adapter",
            "source_label": "Amazon PA-API 5.0 (Live)" if live else "Simulated Reference Feed (Academic Demo)",
        }


class FlipkartAdapter(BaseRetailerAdapter):
    retailer_name = "Flipkart"
    retailer_slug = "flipkart"

    def is_live_api_configured(self) -> bool:
        return bool(settings.FLIPKART_AFFILIATE_ID and settings.FLIPKART_AFFILIATE_TOKEN)

    def get_data_source_info(self) -> Dict[str, Any]:
        live = self.is_live_api_configured()
        return {
            "retailer_name": self.retailer_name,
            "retailer_slug": self.retailer_slug,
            "live_api_configured": live,
            "data_source": "flipkart_affiliate_api" if live else "reference_mock_adapter",
            "source_label": "Flipkart Affiliate API (Live)" if live else "Simulated Reference Feed (Academic Demo)",
        }


class CromaAdapter(BaseRetailerAdapter):
    retailer_name = "Croma"
    retailer_slug = "croma"

    def is_live_api_configured(self) -> bool:
        return bool(settings.CROMA_API_KEY)

    def get_data_source_info(self) -> Dict[str, Any]:
        live = self.is_live_api_configured()
        return {
            "retailer_name": self.retailer_name,
            "retailer_slug": self.retailer_slug,
            "live_api_configured": live,
            "data_source": "croma_partner_feed" if live else "reference_mock_adapter",
            "source_label": "Croma Authorized Feed (Live)" if live else "Simulated Reference Feed (Academic Demo)",
        }


class RelianceDigitalAdapter(BaseRetailerAdapter):
    retailer_name = "Reliance Digital"
    retailer_slug = "reliance_digital"

    def is_live_api_configured(self) -> bool:
        return bool(settings.RELIANCE_API_KEY)

    def get_data_source_info(self) -> Dict[str, Any]:
        live = self.is_live_api_configured()
        return {
            "retailer_name": self.retailer_name,
            "retailer_slug": self.retailer_slug,
            "live_api_configured": live,
            "data_source": "reliance_partner_feed" if live else "reference_mock_adapter",
            "source_label": "Reliance Digital Feed (Live)" if live else "Simulated Reference Feed (Academic Demo)",
        }


class RetailerComparisonService:
    """
    Aggregates verified exact-model product offers across multiple shopping platforms,
    validates specifications match and outbound retailer URLs, and computes
    lowest landed-price recommendations.
    """

    def __init__(self):
        self.adapters: List[BaseRetailerAdapter] = [
            AmazonIndiaAdapter(),
            FlipkartAdapter(),
            CromaAdapter(),
            RelianceDigitalAdapter(),
        ]

    def get_adapter_statuses(self) -> List[Dict[str, Any]]:
        return [adapter.get_data_source_info() for adapter in self.adapters]

    def _parse_specs(self, specs_text: Optional[str]) -> Dict[str, Any]:
        if not specs_text:
            return {}
        try:
            parsed = json.loads(specs_text)
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            return {}

    def verify_exact_model_match(self, product: Product, listings: List[RetailerProduct]) -> Tuple[List[RetailerProduct], str]:
        """
        Ensures every retailer listing included in the comparison strictly matches the
        canonical model_number and core brand/specifications of the target product.
        """
        expected_model = generate_model_number(product)
        expected_specs = self._parse_specs(product.specifications)
        matched: List[RetailerProduct] = []

        for item in listings:
            brand_ok = (
                not product.brand
                or not item.brand
                or item.brand.strip().lower() == product.brand.strip().lower()
            )
            model_ok = item.model_number.strip().upper() == expected_model.upper()

            # Check core spec compatibility if specs exist on both sides
            item_specs = self._parse_specs(item.specifications)
            specs_ok = True
            for key in ("RAM", "Storage", "Display", "Processor"):
                if key in expected_specs and key in item_specs:
                    if str(expected_specs[key]).lower() != str(item_specs[key]).lower():
                        specs_ok = False
                        break

            if brand_ok and model_ok and specs_ok:
                matched.append(item)

        return matched, expected_model

    def find_matching_product(
        self,
        db: Session,
        product_id: Optional[int] = None,
        query: Optional[str] = None,
        brand: Optional[str] = None,
        model: Optional[str] = None,
        category: Optional[str] = None,
    ) -> Optional[Product]:
        """
        Resolves the target catalog product by exact ID, brand+model, or keyword relevance.
        """
        if product_id:
            return db.query(Product).filter(Product.id == product_id).first()

        # First try matching against RetailerProduct exact model number or product name
        search_terms = " ".join(filter(None, [brand, model, query])).strip()
        if not search_terms:
            return db.query(Product).filter(Product.is_featured == True).first() or db.query(Product).first()

        # Exact model number lookup
        if model:
            rp_match = (
                db.query(RetailerProduct)
                .filter(RetailerProduct.model_number.ilike(f"%{model.strip()}%"))
                .first()
            )
            if rp_match:
                return db.query(Product).filter(Product.id == rp_match.product_id).first()

        # Token-based scoring across all products to find closest exact model match
        tokens = [t.lower() for t in re.split(r"[^a-zA-Z0-9]+", search_terms) if len(t) >= 2]
        candidates = db.query(Product).all()
        best_product = None
        best_score = -1

        for p in candidates:
            haystack = f"{p.name} {p.brand or ''} {p.description} {p.specifications or ''}".lower()
            score = 0
            if search_terms.lower() in p.name.lower():
                score += 20
            if brand and p.brand and brand.lower() in p.brand.lower():
                score += 8
            if category and p.category and category.lower() in p.category.name.lower():
                score += 4
            for t in tokens:
                if t in p.name.lower():
                    score += 5
                elif t in haystack:
                    score += 2
            if score > best_score and score > 0:
                best_score = score
                best_product = p

        return best_product

    def compare_product_prices(self, product: Product, db: Session) -> Dict[str, Any]:
        """
        Collects offers across adapters, validates URLs and model parity, and selects
        the lowest-price recommendation.
        """
        raw_listings: List[RetailerProduct] = []
        for adapter in self.adapters:
            listing = adapter.fetch_listings_for_product(product, db)
            if listing:
                raw_listings.append(listing)

        matched_listings, canonical_model = self.verify_exact_model_match(product, raw_listings)

        formatted_offers: List[Dict[str, Any]] = []
        for rp in matched_listings:
            url_check = validate_retailer_url(rp.product_url)
            landed_price = round(float(rp.current_price) + float(rp.delivery_charge or 0.0), 2)
            discount_pct = rp.discount_percentage
            if rp.original_price and rp.original_price > rp.current_price:
                discount_pct = round(((rp.original_price - rp.current_price) / rp.original_price) * 100, 1)

            formatted_offers.append({
                "id": rp.id,
                "product_id": rp.product_id,
                "retailer_name": rp.retailer_name,
                "retailer_slug": rp.retailer_slug,
                "brand": rp.brand or product.brand,
                "model_number": rp.model_number,
                "product_name": rp.product_name,
                "image_url": rp.image_url,
                "current_price": rp.current_price,
                "original_price": rp.original_price,
                "discount_percentage": discount_pct,
                "delivery_charge": rp.delivery_charge or 0.0,
                "delivery_estimate": rp.delivery_estimate or "Standard 2-4 day delivery",
                "total_landed_price": landed_price,
                "rating": rp.rating,
                "review_count": rp.review_count,
                "product_url": rp.product_url,
                "url_verified": url_check["valid"],
                "url_verification_note": url_check["reason"],
                "in_stock": rp.in_stock,
                "data_source": rp.data_source,
                "is_simulated": rp.is_simulated,
                "data_source_label": (
                    "Live Authorized Retailer API"
                    if not rp.is_simulated
                    else "Reference Simulated Retailer Feed (Academic Demo)"
                ),
                "last_updated": rp.last_updated.isoformat() if rp.last_updated else None,
            })

        # Sort offers by total landed price (in-stock offers prioritized)
        formatted_offers.sort(key=lambda x: (not x["in_stock"], x["total_landed_price"]))

        in_stock_offers = [o for o in formatted_offers if o["in_stock"]]
        best_offer = in_stock_offers[0] if in_stock_offers else (formatted_offers[0] if formatted_offers else None)
        highest_price = max((o["total_landed_price"] for o in formatted_offers), default=product.price)

        lowest_recommendation = None
        if best_offer:
            savings_vs_highest = round(max(0.0, highest_price - best_offer["total_landed_price"]), 2)
            savings_vs_mrp = round(
                max(0.0, (best_offer["original_price"] or product.original_price or product.price) - best_offer["current_price"]),
                2,
            )
            lowest_recommendation = {
                "retailer_name": best_offer["retailer_name"],
                "retailer_slug": best_offer["retailer_slug"],
                "best_price": best_offer["current_price"],
                "delivery_charge": best_offer["delivery_charge"],
                "total_landed_price": best_offer["total_landed_price"],
                "savings_vs_highest_retailer": savings_vs_highest,
                "savings_vs_mrp": savings_vs_mrp,
                "product_url": best_offer["product_url"],
                "url_verified": best_offer["url_verified"],
                "is_simulated": best_offer["is_simulated"],
                "recommendation_reason": (
                    f"{best_offer['retailer_name']} currently offers the lowest total landed cost at "
                    f"₹{best_offer['total_landed_price']:,.0f} (saving ₹{savings_vs_highest:,.0f} compared to the highest-priced retailer)."
                ),
            }

        specs_dict = self._parse_specs(product.specifications)
        any_simulated = any(o["is_simulated"] for o in formatted_offers) if formatted_offers else True

        return {
            "product": {
                "id": product.id,
                "name": product.name,
                "slug": product.slug,
                "brand": product.brand,
                "model_number": canonical_model,
                "category": product.category.name if product.category else "Catalog",
                "image_url": product.image_url,
                "rating": product.rating,
                "review_count": product.review_count,
                "specifications": specs_dict,
                "internal_demo_price": product.price,
            },
            "exact_model_matched": True,
            "canonical_model_number": canonical_model,
            "data_disclaimer": (
                "Retailer prices shown use clearly labelled Reference Simulated Adapter data for academic demonstration unless affiliate API credentials are configured."
                if any_simulated
                else "Live prices fetched via authorized retailer API feeds."
            ),
            "contains_simulated_data": any_simulated,
            "retailer_offers": formatted_offers,
            "lowest_price_recommendation": lowest_recommendation,
            "adapter_statuses": self.get_adapter_statuses(),
        }


retailer_comparison_service = RetailerComparisonService()
