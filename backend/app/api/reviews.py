from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewOut, ReviewSummary
from app.utils.auth import get_current_user
from app.ai.gemini_service import gemini_service

router = APIRouter(prefix="/reviews", tags=["Reviews"])

@router.get("/{product_id}", response_model=List[ReviewOut])
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.product_id == product_id).order_by(Review.created_at.desc()).all()
    out = []
    for r in reviews:
        user_name = r.user.full_name if r.user else "Verified Customer"
        out.append(ReviewOut(
            id=r.id,
            product_id=r.product_id,
            user_id=r.user_id,
            user_name=user_name,
            rating=r.rating,
            title=r.title,
            comment=r.comment,
            verified_purchase=r.verified_purchase,
            sentiment=r.sentiment,
            created_at=r.created_at
        ))
    return out

@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def add_review(review_in: ReviewCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == review_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Simple sentiment heuristic
    sentiment = "positive" if review_in.rating >= 4.0 else ("neutral" if review_in.rating >= 3.0 else "negative")

    review = Review(
        product_id=review_in.product_id,
        user_id=current_user.id,
        rating=review_in.rating,
        title=review_in.title,
        comment=review_in.comment,
        sentiment=sentiment,
        verified_purchase=1
    )
    db.add(review)

    # Recalculate product rating
    reviews = db.query(Review).filter(Review.product_id == product.id).all()
    all_ratings = [r.rating for r in reviews] + [review_in.rating]
    product.rating = round(sum(all_ratings) / len(all_ratings), 1)
    product.review_count = len(all_ratings)

    db.commit()
    db.refresh(review)

    return ReviewOut(
        id=review.id,
        product_id=review.product_id,
        user_id=review.user_id,
        user_name=current_user.full_name,
        rating=review.rating,
        title=review.title,
        comment=review.comment,
        verified_purchase=review.verified_purchase,
        sentiment=review.sentiment,
        created_at=review.created_at
    )

@router.get("/{product_id}/summary", response_model=ReviewSummary)
def get_ai_review_summary(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    reviews = db.query(Review).filter(Review.product_id == product_id).all()
    ratings = [r.rating for r in reviews]
    avg = round(sum(ratings) / len(ratings), 1) if ratings else product.rating
    comments = [r.comment for r in reviews]

    pos_count = sum(1 for r in reviews if r.rating >= 4.0)
    neu_count = sum(1 for r in reviews if 2.5 <= r.rating < 4.0)
    neg_count = sum(1 for r in reviews if r.rating < 2.5)

    ai_data = gemini_service.summarize_reviews(product.name, comments)

    return ReviewSummary(
        product_id=product.id,
        average_rating=avg,
        total_reviews=len(reviews) if reviews else product.review_count,
        sentiment_breakdown={
            "positive": pos_count,
            "neutral": neu_count,
            "negative": neg_count
        },
        ai_summary=ai_data.get("summary"),
        key_pros=ai_data.get("pros", ["Great quality", "Excellent value"]),
        key_cons=ai_data.get("cons", ["Standard packaging"])
    )
