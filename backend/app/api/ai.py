import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List

from app.database import get_db
from app.models.user import User
from app.models.product import Product, Category
from app.schemas.ai import (
    SmartSearchRequest, SmartSearchResponse, SmartSearchFilter,
    ChatRequest, ChatResponse,
    CompareRequest, CompareResponse,
    VisualSearchRequest, VisualSearchResponse,
    RecommendationResponse
)
from app.utils.auth import get_optional_current_user
from app.ai.nlp_search import parse_natural_language_query
from app.ai.gemini_service import gemini_service
from app.ai.visual_search import search_by_image
from app.ai.recommender import recommender

router = APIRouter(prefix="/ai", tags=["AI & Machine Learning"])

@router.post("/smart-search", response_model=SmartSearchResponse)
def natural_language_search(req: SmartSearchRequest, db: Session = Depends(get_db)):
    parsed = parse_natural_language_query(req.query)

    query = db.query(Product)

    if parsed.get("category"):
        cat = db.query(Category).filter(Category.name.ilike(f"%{parsed['category']}%")).first()
        if cat:
            query = query.filter(Product.category_id == cat.id)

    if parsed.get("brand"):
        query = query.filter(Product.brand.ilike(f"%{parsed['brand']}%"))

    if parsed.get("min_price") is not None:
        query = query.filter(Product.price >= parsed["min_price"])

    if parsed.get("max_price") is not None:
        query = query.filter(Product.price <= parsed["max_price"])

    if parsed.get("min_rating") is not None:
        query = query.filter(Product.rating >= parsed["min_rating"])

    # If keywords exist and results are too broad, match keywords
    keywords = parsed.get("keywords", [])
    if keywords:
        kw_conditions = []
        for kw in keywords[:4]:
            kw_conditions.append(Product.name.ilike(f"%{kw}%"))
            kw_conditions.append(Product.description.ilike(f"%{kw}%"))
        query = query.filter(or_(*kw_conditions))

    results = query.order_by(Product.rating.desc()).limit(16).all()

    # Fallback if too restrictive: show closest matches
    if not results:
        results = db.query(Product).order_by(Product.rating.desc()).limit(8).all()

    filters_obj = SmartSearchFilter(
        category=parsed.get("category"),
        brand=parsed.get("brand"),
        min_price=parsed.get("min_price"),
        max_price=parsed.get("max_price"),
        min_rating=parsed.get("min_rating"),
        keywords=keywords,
        sort_by="relevance"
    )

    return SmartSearchResponse(
        query=req.query,
        interpreted_filters=filters_obj,
        ai_explanation=parsed.get("explanation", "Searched catalog using smart query interpretation"),
        results=results,
        total=len(results)
    )

@router.post("/chat", response_model=ChatResponse)
def chat_with_assistant(
    req: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    # Fetch 10 featured or relevant products as grounding context
    if req.current_product_id:
        context_prods = [db.query(Product).filter(Product.id == req.current_product_id).first()]
        context_prods += recommender.get_similar_products(req.current_product_id, db, top_n=3)
        context_prods = [p for p in context_prods if p]
    else:
        context_prods = db.query(Product).order_by(Product.rating.desc()).limit(10).all()

    catalog_lines = []
    for p in context_prods:
        catalog_lines.append(f"- ID {p.id}: {p.name} | Category: {p.category.name if p.category else 'General'} | Price: ₹{p.price:,.0f} | Rating: {p.rating}★ | Stock: {p.stock}")
    catalog_context = "\n".join(catalog_lines)

    # Convert history
    history_dicts = [{"role": h.role, "content": h.content} for h in req.history]

    reply = gemini_service.chat_assistant(req.message, history_dicts, catalog_context)

    # Suggest 2-3 products related to query
    suggested = []
    for p in context_prods:
        if any(w in p.name.lower() for w in req.message.lower().split() if len(w) > 3):
            suggested.append(p)
    if not suggested:
        suggested = context_prods[:3]

    quick_actions = [
        "Tell me more about specifications",
        "Compare with alternative models",
        "What coupons can I use?",
        "Are there student discounts?"
    ]

    return ChatResponse(
        reply=reply,
        suggested_products=suggested[:3],
        quick_actions=quick_actions
    )

@router.post("/visual-search", response_model=VisualSearchResponse)
def visual_search_route(req: VisualSearchRequest, db: Session = Depends(get_db)):
    res = search_by_image(
        image_base64=req.image_base64,
        image_url=req.image_url,
        description_hint=req.description_hint,
        db=db
    )
    return VisualSearchResponse(
        detected_attributes=res["detected_attributes"],
        matched_category=res["matched_category"],
        identified_product=res.get("identified_product"),
        confidence_score=res["confidence_score"],
        matched_products=res["matched_products"],
        search_method=res["search_method"],
        ai_vision_used=res.get("ai_vision_used", False),
        method_explanation=res.get("method_explanation"),
        retailer_comparison=res.get("retailer_comparison"),
    )

@router.post("/compare", response_model=CompareResponse)
def compare_products_route(req: CompareRequest, db: Session = Depends(get_db)):
    if len(req.product_ids) < 2:
        raise HTTPException(status_code=400, detail="Please select at least 2 products to compare.")

    products = db.query(Product).filter(Product.id.in_(req.product_ids)).all()
    if not products:
        raise HTTPException(status_code=404, detail="Selected products not found")

    prods_summary = []
    for p in products:
        specs_dict = {}
        if p.specifications:
            try:
                specs_dict = json.loads(p.specifications)
            except Exception:
                specs_dict = {}

        prods_summary.append({
            "id": p.id,
            "name": p.name,
            "brand": p.brand,
            "price": p.price,
            "rating": p.rating,
            "specs": specs_dict,
            "stock": p.stock
        })

    ai_result = gemini_service.compare_products_ai(prods_summary)

    # Build side-by-side comparison matrix
    matrix = [
        {"feature": "Brand", **{str(p.id): p.brand for p in products}},
        {"feature": "Price", **{str(p.id): f"₹{p.price:,.2f}" for p in products}},
        {"feature": "Customer Rating", **{str(p.id): f"{p.rating} ★ ({p.review_count} reviews)" for p in products}},
        {"feature": "Availability", **{str(p.id): f"{p.stock} units in stock" if p.stock > 0 else "Out of Stock" for p in products}},
        {"feature": "Category", **{str(p.id): p.category.name if p.category else "-" for p in products}}
    ]

    return CompareResponse(
        products=products,
        ai_comparison_verdict=ai_result.get("verdict", "Comparison complete."),
        best_value_winner=ai_result.get("best_value"),
        best_performance_winner=ai_result.get("best_performance"),
        comparison_matrix=matrix
    )

@router.get("/recommendations", response_model=RecommendationResponse)
def get_recommendations_route(
    strategy: str = "personalized",
    product_id: Optional[int] = None,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id if current_user else None

    if strategy == "content_based" and product_id:
        recs = recommender.get_similar_products(product_id, db, top_n=8)
    elif strategy == "trending":
        recs = recommender.get_trending_products(db, top_n=8)
    else:
        recs = recommender.get_personalized_recommendations(user_id, db, top_n=8)

    return RecommendationResponse(
        strategy=strategy,
        recommendations=recs
    )
