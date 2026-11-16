import re
from typing import Dict, Any, List
from app.ai.gemini_service import gemini_service

CATEGORY_KEYWORDS = {
    "Laptops & Computing": ["laptop", "laptops", "macbook", "computer", "notebook", "ultrabook", "gaming laptop", "pc", "desktop"],
    "Smartphones & Audio": ["phone", "smartphone", "iphone", "android", "mobile", "headphones", "earbuds", "earphones", "airpods", "speaker"],
    "Electronics": ["tv", "television", "smart tv", "camera", "monitor", "charger", "gadget", "tablet", "ipad"],
    "Fashion & Apparel": ["shirt", "t-shirt", "jeans", "jacket", "dress", "clothing", "hoodie", "shoes", "sneakers", "wear"],
    "Home & Kitchen": ["blender", "coffee maker", "cooker", "vacuum", "air purifier", "microwave", "kitchen", "furniture", "lamp"],
    "Fitness & Lifestyle": ["smartwatch", "fitness", "yoga", "gym", "treadmill", "dumbbells", "band", "workout", "tracker"]
}

KNOWN_BRANDS = [
    "Apple", "Samsung", "Sony", "Dell", "HP", "Asus", "Lenovo", "OnePlus",
    "Nike", "Adidas", "Puma", "Philips", "Dyson", "Boat", "JBL", "Xiaomi"
]

def parse_natural_language_query(query: str) -> Dict[str, Any]:
    # 1. Try Gemini first if configured
    if gemini_service.is_available():
        gemini_result = gemini_service.parse_natural_search(query)
        if gemini_result and isinstance(gemini_result, dict):
            # Normalize keys
            return {
                "category": gemini_result.get("category"),
                "brand": gemini_result.get("brand"),
                "min_price": gemini_result.get("min_price"),
                "max_price": gemini_result.get("max_price"),
                "min_rating": gemini_result.get("min_rating"),
                "keywords": gemini_result.get("keywords", []),
                "explanation": gemini_result.get("explanation", f"AI parsed query for '{query}'")
            }

    # 2. Rule-based NLP extraction fallback
    q_lower = query.lower()
    detected_category = None
    detected_brand = None
    min_price = None
    max_price = None
    min_rating = None
    keywords = []

    # Category matching
    for cat_name, terms in CATEGORY_KEYWORDS.items():
        if any(term in q_lower for term in terms):
            detected_category = cat_name
            break

    # Brand matching
    for brand in KNOWN_BRANDS:
        if brand.lower() in q_lower:
            detected_brand = brand
            break

    # Price extraction: e.g., "under 50000", "under ₹50,000", "below 30k", "under 1.5 lakh"
    under_match = re.search(r'(?:under|below|less than|within|upto)\s*(?:rs\.?|inr|₹)?\s*([0-9]+(?:\.[0-9]+)?)\s*(k|lakh|l)?', q_lower)
    if under_match:
        val = float(under_match.group(1))
        unit = under_match.group(2)
        if unit == 'k':
            val *= 1000
        elif unit in ('l', 'lakh'):
            val *= 100000
        max_price = val

    # Above/min price
    above_match = re.search(r'(?:above|over|more than|from)\s*(?:rs\.?|inr|₹)?\s*([0-9]+(?:\.[0-9]+)?)\s*(k|lakh|l)?', q_lower)
    if above_match:
        val = float(above_match.group(1))
        unit = above_match.group(2)
        if unit == 'k':
            val *= 1000
        elif unit in ('l', 'lakh'):
            val *= 100000
        min_price = val

    # Rating extraction: "above 4 stars", "4.5 rating", "highly rated"
    rating_match = re.search(r'([1-5](?:\.[0-9])?)\s*(?:star|\*|rating)', q_lower)
    if rating_match:
        min_rating = float(rating_match.group(1))
    elif "highly rated" in q_lower or "best rated" in q_lower or "top rated" in q_lower:
        min_rating = 4.2

    # Keywords (remove stop words and numerical values)
    clean_words = re.sub(r'[^a-zA-Z0-9\s]', ' ', q_lower).split()
    stopwords = {"show", "me", "find", "under", "below", "above", "for", "the", "a", "an", "with", "in", "and", "or", "to", "of", "rs", "inr"}
    keywords = [w for w in clean_words if w not in stopwords and len(w) > 2]

    explanation_parts = []
    if detected_category:
        explanation_parts.append(f"category '{detected_category}'")
    if detected_brand:
        explanation_parts.append(f"brand '{detected_brand}'")
    if max_price:
        explanation_parts.append(f"budget under ₹{int(max_price):,}")
    if min_rating:
        explanation_parts.append(f"rating ≥ {min_rating}★")

    explanation = "Filtered by " + ", ".join(explanation_parts) if explanation_parts else "Searched across catalog for relevant matches"

    return {
        "category": detected_category,
        "brand": detected_brand,
        "min_price": min_price,
        "max_price": max_price,
        "min_rating": min_rating,
        "keywords": keywords,
        "explanation": explanation
    }
