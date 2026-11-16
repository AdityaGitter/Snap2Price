import os
import json
import logging
from typing import Optional, List, Dict, Any

from app.config import settings

logger = logging.getLogger("shopsmart.gemini")

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL or "gemini-3.8-flash"
        self.client = None
        self._init_client()

    def _init_client(self):
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info("Initialized Google GenAI Client with model %s", self.model_name)
            except Exception as e:
                logger.warning(f"Could not initialize google-genai client: {e}")
                self.client = None

    def is_available(self) -> bool:
        return bool(self.client and self.api_key)

    def chat_assistant(self, user_message: str, history: List[Dict[str, str]], catalog_context: str) -> str:
        """
        Interactive conversational AI shopping assistant with catalog grounding.
        """
        if not self.is_available():
            return self._fallback_chat(user_message, catalog_context)

        system_instruction = (
            "You are 'Smarty', the expert AI shopping concierge for ShopSmart AI. "
            "You help shoppers discover products, compare specifications, find the best deals, "
            "and suggest relevant accessories. "
            "Always be warm, helpful, professional, and concise. "
            "Grounded Catalog Context:\n"
            f"{catalog_context}\n"
            "Only recommend products that exist in the catalog context when possible. "
            "Mention prices in Indian Rupees (₹) accurately."
        )

        try:
            # Format contents or prompt
            formatted_prompt = f"{system_instruction}\n\nUser Question: {user_message}"
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=formatted_prompt
            )
            return response.text
        except Exception as e:
            logger.warning(f"Gemini chat API call failed: {e}. Using intelligent fallback.")
            return self._fallback_chat(user_message, catalog_context)

    def parse_natural_search(self, user_query: str) -> Dict[str, Any]:
        """
        Extract structured search filters from free-form natural language query.
        """
        if not self.is_available():
            return {}

        prompt = f"""
Analyze this shopping search query: "{user_query}"
Extract search intent and respond strictly with valid JSON with these keys:
{{
    "category": string or null,
    "brand": string or null,
    "min_price": number or null,
    "max_price": number or null,
    "min_rating": number or null,
    "keywords": list of strings,
    "explanation": short sentence explaining how query was interpreted
}}
Note: Prices in Indian Rupees (e.g. 50k = 50000, 1.5L = 150000). Return ONLY the JSON object.
"""
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            text = response.text.strip()
            # Clean markdown codeblocks if returned
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            data = json.loads(text.strip())
            return data
        except Exception as e:
            logger.warning(f"Gemini natural search parsing failed: {e}")
            return {}

    def analyze_image_for_search(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> Dict[str, Any]:
        """
        Multimodal visual analysis of an uploaded product image for Snap2Price identification.
        Extracts category, brand, exact model, product_name, visual_attributes, and specifications.
        """
        if not self.is_available():
            return {}

        try:
            from google.genai import types
            prompt = """
Analyze this product photograph accurately for multi-retailer e-commerce price comparison (Snap2Price).
Identify the product category, brand, specific model name/number, product title, visual characteristics, and probable specifications visible or known for that model.
Respond strictly with valid JSON using this exact structure:
{
    "category": "Electronics" | "Laptops & Computing" | "Smartphones & Audio" | "Fashion & Apparel" | "Home & Kitchen" | "Fitness & Lifestyle",
    "brand": string or null (e.g. "Apple", "Sony", "Samsung", "Dell"),
    "model": string or null (e.g. "WH-1000XM5", "MacBook Air M3", "Galaxy S24 Ultra"),
    "product_name": string (concise full product title),
    "product_type": string (e.g. "wireless headphones", "laptop", "smartwatch"),
    "primary_color": string,
    "visual_attributes": list of strings (colors, form factor, finish, materials),
    "specifications": object of key-value strings (relevant technical or physical specs if identifiable),
    "search_keywords": list of strings,
    "visual_description": string (concise factual description of what is visible in the image)
}
Only cite attributes/models you can visually justify; set brand/model to null if genuinely unrecognizable. Return ONLY valid JSON.
"""
            part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[part, prompt]
            )
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            return json.loads(text.strip())
        except Exception as e:
            logger.warning(f"Gemini multimodal vision failed: {e}")
            return {}

    def summarize_reviews(self, product_name: str, reviews: List[str]) -> Dict[str, Any]:
        """
        Summarizes customer reviews with key pros and cons.
        """
        if not self.is_available() or not reviews:
            return {
                "summary": f"Customers generally appreciate the overall quality and value of {product_name}.",
                "pros": ["Solid build quality", "Good value for money", "Reliable performance"],
                "cons": ["Standard packaging"]
            }

        prompt = f"""
Summarize the customer reviews for '{product_name}'.
Customer reviews:
{chr(10).join(reviews[:15])}

Return strictly a JSON object:
{{
    "summary": "1-2 sentence high-level sentiment overview",
    "pros": ["pro 1", "pro 2", "pro 3"],
    "cons": ["con 1", "con 2"]
}}
"""
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            return json.loads(text.strip())
        except Exception:
            return {
                "summary": f"Shoppers love the design and performance of {product_name}.",
                "pros": ["High satisfaction rating", "Great performance"],
                "cons": ["Limited stock availability"]
            }

    def compare_products_ai(self, products_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generates side-by-side comparison verdict and winner recommendations.
        """
        if not self.is_available():
            p_names = [p["name"] for p in products_data]
            cheapest = min(products_data, key=lambda x: x["price"])
            highest_rated = max(products_data, key=lambda x: x["rating"])
            return {
                "verdict": f"Comparing {', '.join(p_names)}: '{cheapest['name']}' offers the best budget value at ₹{cheapest['price']:,}, while '{highest_rated['name']}' leads with a {highest_rated['rating']}★ customer rating.",
                "best_value": cheapest["name"],
                "best_performance": highest_rated["name"]
            }

        prompt = f"""
Compare the following products side by side:
{json.dumps(products_data, indent=2)}

Provide an objective buying guide. Respond strictly in JSON:
{{
    "verdict": "Detailed 2-3 sentence buying verdict comparing strengths, target audience, and best use-cases.",
    "best_value": "Exact name of the product that offers highest value for price",
    "best_performance": "Exact name of the product with best features/performance"
}}
"""
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            return json.loads(text.strip())
        except Exception:
            cheapest = min(products_data, key=lambda x: x["price"])
            highest_rated = max(products_data, key=lambda x: x["rating"])
            return {
                "verdict": f"Both choices excel in their class. {cheapest['name']} is the value champion, while {highest_rated['name']} delivers top-tier ratings and premium specifications.",
                "best_value": cheapest["name"],
                "best_performance": highest_rated["name"]
            }

    def _fallback_chat(self, message: str, context: str) -> str:
        msg = message.lower()
        if "laptop" in msg or "computer" in msg:
            return "Looking for a great laptop? I recommend checking out our high-performance models like the Apple MacBook Air M3 and Asus ROG Zephyrus G16, or budget-friendly options under ₹50,000 in our Laptops & Computing section!"
        elif "headphone" in msg or "audio" in msg or "sound" in msg:
            return "For music and calling, our top-rated audio picks include the Sony WH-1000XM5 Noise-Canceling Headphones and Apple AirPods Pro 2. Both feature industry-leading sound clarity!"
        elif "watch" in msg or "fitness" in msg:
            return "Looking for wearable tech? The Apple Watch Series 9 and Samsung Galaxy Watch 6 feature continuous heart-rate tracking, sleep tracking, and GPS workouts."
        elif "phone" in msg or "smartphone" in msg:
            return "Our flagship smartphone lineup includes the iPhone 15 Pro, Samsung Galaxy S24 Ultra, and OnePlus 12. Tell me your budget and priority (camera, battery, gaming) and I'll find your perfect match!"
        elif "discount" in msg or "coupon" in msg or "offer" in msg:
            return "You can use code **SMART10** for 10% off your entire order, or **FESTIVE20** on orders above ₹2,000! Enter the code at checkout."
        else:
            return f"Welcome to ShopSmart AI! I can help you find products, compare options, check prices, and track orders. What are you looking to buy today?"

gemini_service = GeminiService()
