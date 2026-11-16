import numpy as np
import logging
from typing import List, Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session

from app.models.product import Product, ProductView
from app.models.order import Order, OrderItem
from app.models.cart import Cart, CartItem
from app.utils.redis_client import cache

logger = logging.getLogger("shopsmart.recommender")

class ContentRecommender:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
        self.tfidf_matrix = None
        self.product_ids: List[int] = []
        self.product_id_to_idx: Dict[int, int] = {}
        self.idx_to_product_id: Dict[int, int] = {}

    def fit(self, products: List[Product]):
        if not products:
            return

        self.product_ids = [p.id for p in products]
        self.product_id_to_idx = {p.id: i for i, p in enumerate(products)}
        self.idx_to_product_id = {i: p.id for i, p in enumerate(products)}

        corpus = []
        for p in products:
            category_name = p.category.name if p.category else ""
            brand = p.brand or ""
            features = p.features or ""
            specs = p.specifications or ""
            text = f"{p.name} {p.name} {category_name} {category_name} {brand} {brand} {p.description} {features} {specs}"
            corpus.append(text)

        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)
        logger.info(f"Recommender model fitted with {len(products)} products.")

    def get_similar_products(self, product_id: int, db: Session, top_n: int = 5) -> List[Product]:
        cache_key = f"rec:similar:{product_id}:{top_n}"
        cached_ids = cache.get(cache_key)
        if cached_ids:
            products = db.query(Product).filter(Product.id.in_(cached_ids)).all()
            # Preserve ordering
            p_map = {p.id: p for p in products}
            return [p_map[pid] for pid in cached_ids if pid in p_map]

        if self.tfidf_matrix is None or product_id not in self.product_id_to_idx:
            # Fallback to category based recommendations
            target = db.query(Product).filter(Product.id == product_id).first()
            if not target:
                return []
            return db.query(Product).filter(
                Product.category_id == target.category_id,
                Product.id != product_id
            ).limit(top_n).all()

        idx = self.product_id_to_idx[product_id]
        sim_scores = cosine_similarity(self.tfidf_matrix[idx], self.tfidf_matrix).flatten()
        
        # Sort descending, excluding the product itself
        sorted_indices = np.argsort(sim_scores)[::-1]
        sorted_indices = [i for i in sorted_indices if i != idx][:top_n]

        recommended_ids = [self.idx_to_product_id[i] for i in sorted_indices]
        cache.set(cache_key, recommended_ids, expire_seconds=3600)

        products = db.query(Product).filter(Product.id.in_(recommended_ids)).all()
        p_map = {p.id: p for p in products}
        return [p_map[pid] for pid in recommended_ids if pid in p_map]

    def get_personalized_recommendations(self, user_id: Optional[int], db: Session, top_n: int = 8) -> List[Product]:
        if not user_id:
            return self.get_trending_products(db, top_n)

        cache_key = f"rec:user:{user_id}:{top_n}"
        cached_ids = cache.get(cache_key)
        if cached_ids:
            products = db.query(Product).filter(Product.id.in_(cached_ids)).all()
            p_map = {p.id: p for p in products}
            return [p_map[pid] for pid in cached_ids if pid in p_map]

        # Collect user interactions: recent views, cart items, past order items
        recent_views = db.query(ProductView.product_id).filter(
            ProductView.user_id == user_id
        ).order_by(ProductView.viewed_at.desc()).limit(10).all()
        view_ids = [v[0] for v in recent_views]

        user_cart = db.query(Cart).filter(Cart.user_id == user_id).first()
        cart_ids = [item.product_id for item in user_cart.items] if user_cart else []

        past_orders = db.query(OrderItem.product_id).join(Order).filter(
            Order.user_id == user_id
        ).all()
        order_ids = [o[0] for o in past_orders]

        target_ids = list(dict.fromkeys(view_ids + cart_ids + order_ids))

        if not target_ids or self.tfidf_matrix is None:
            return self.get_trending_products(db, top_n)

        # Compute aggregate user vector
        valid_indices = [self.product_id_to_idx[pid] for pid in target_ids if pid in self.product_id_to_idx]
        if not valid_indices:
            return self.get_trending_products(db, top_n)

        user_vector = np.asarray(self.tfidf_matrix[valid_indices].mean(axis=0))
        sim_scores = cosine_similarity(user_vector, self.tfidf_matrix).flatten()

        sorted_indices = np.argsort(sim_scores)[::-1]
        recommended_ids = []
        for i in sorted_indices:
            pid = self.idx_to_product_id[i]
            if pid not in target_ids:
                recommended_ids.append(pid)
            if len(recommended_ids) >= top_n:
                break

        cache.set(cache_key, recommended_ids, expire_seconds=1800)
        products = db.query(Product).filter(Product.id.in_(recommended_ids)).all()
        p_map = {p.id: p for p in products}
        return [p_map[pid] for pid in recommended_ids if pid in p_map]

    def get_trending_products(self, db: Session, top_n: int = 8) -> List[Product]:
        return db.query(Product).filter(Product.is_featured == True).order_by(
            Product.rating.desc(), Product.review_count.desc()
        ).limit(top_n).all()

recommender = ContentRecommender()
