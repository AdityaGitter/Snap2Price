import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star, ShoppingCart, Heart, Shield, Sparkles, Check, Truck,
  RefreshCw, Layers, ThumbsUp, ThumbsDown, MessageSquarePlus,
  Tag, LineChart, Bell
} from 'lucide-react';
import { api } from '../services/api';
import { Product, Review, ReviewSummary } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/ProductCard';

export const ProductDetailPage: React.FC = () => {
  const { idOrSlug, id } = useParams<{ idOrSlug?: string; id?: string }>();
  const resolvedId = idOrSlug || id;
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { success, error } = useToast();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // New review form
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!resolvedId) return;
    const fetchProductData = async () => {
      setLoading(true);
      try {
        const prod = await api.getProduct(resolvedId);
        setProduct(prod);

        // Concurrently fetch similar items, reviews, and AI review summary
        const [sim, revs, summary] = await Promise.all([
          api.getSimilarProducts(prod.id, 4),
          api.getReviews(prod.id),
          api.getReviewSummary(prod.id),
        ]);
        setSimilarProducts(sim);
        setReviews(revs);
        setReviewSummary(summary);
      } catch (err) {
        console.error('Failed to load product details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProductData();
    window.scrollTo(0, 0);
  }, [resolvedId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Product Not Found</h2>
        <Link to="/products" className="inline-block px-5 py-2.5 bg-purple-600 text-white rounded-full text-xs font-bold">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const discountPercent = product.original_price && product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  let specsObj: Record<string, string> = {};
  if (product.specifications) {
    try {
      specsObj = JSON.parse(product.specifications);
    } catch {
      specsObj = {};
    }
  }

  const handleAddToCart = async () => {
    await addToCart(product, quantity);
    success(`Added ${quantity} "${product.name}" to cart!`);
  };

  const handleToggleWishlist = async () => {
    if (inWishlist) {
      await removeFromWishlist(product.id);
      success('Removed from wishlist');
    } else {
      await addToWishlist(product);
      success('Added to wishlist');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingReview(true);
    try {
      const created = await api.addReview(product.id, newRating, newComment);
      setReviews([created, ...reviews]);
      setNewComment('');
      success('Thank you! Your verified review has been submitted.');
    } catch (err) {
      error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumbs */}
      <nav className="text-xs text-slate-500 flex items-center gap-1.5">
        <Link to="/" className="hover:text-purple-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-purple-600">Products</Link>
        <span>/</span>
        <Link to={`/products?category=${product.category?.slug}`} className="hover:text-purple-600">
          {product.category?.name}
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase: Gallery + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left: Product Image */}
        <div className="space-y-4 sticky top-24">
          <div className="aspect-square rounded-3xl overflow-hidden bg-white border border-slate-200/80 shadow-lg relative group">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            {discountPercent && (
              <span className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md">
                {discountPercent}% OFF
              </span>
            )}
            <button
              onClick={handleToggleWishlist}
              className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md shadow-md transition ${
                inWishlist ? 'bg-rose-50 text-rose-500' : 'bg-white/80 text-slate-500 hover:text-rose-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${inWishlist ? 'fill-rose-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Right: Info, Price, Actions */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                {product.category?.name || 'Catalog Item'}
              </span>
              {product.brand && (
                <span className="text-xs font-semibold text-slate-600">Brand: {product.brand}</span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Rating & Stock */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-amber-900">{product.rating.toFixed(1)}</span>
                <span className="text-[11px] text-amber-700">({product.review_count} ratings)</span>
              </div>
              <span className="text-xs text-slate-300">|</span>
              <span className={`text-xs font-bold ${product.stock > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {product.stock > 0 ? `In Stock (${product.stock} units available)` : 'Out of Stock'}
              </span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-sm text-slate-400 line-through">
                  ₹{product.original_price.toLocaleString('en-IN')}
                </span>
              )}
              {discountPercent && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Save ₹{(product.original_price! - product.price).toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Inclusive of 18% GST • Free express shipping on all simulated orders
            </p>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-600 leading-relaxed">
            {product.description}
          </p>

          {/* Features bullet list */}
          {product.features && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Key Highlights</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {product.features.split('\n').filter(Boolean).map((feat, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 font-bold transition"
                >
                  -
                </button>
                <span className="px-4 py-2 text-xs font-extrabold text-slate-800 min-w-8 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 font-bold transition"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-sm font-bold shadow-lg shadow-purple-500/20 active:scale-98 transition"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Demo Cart</span>
              </button>
            </div>

            {/* Snap2Price Multi-Platform Intelligence Bar (Separate from Internal Demo Cart) */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Snap2Price Multi-Retailer Intelligence
                </span>
                <span className="text-[10px] font-semibold text-emerald-700">External Merchant Links</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/price-comparison?productId=${product.id}`}
                  className="flex-1 min-w-[160px] py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Compare 4 Retailers</span>
                </Link>
                <Link
                  to={`/price-history/${product.id}`}
                  className="flex-1 min-w-[150px] py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <LineChart className="w-3.5 h-3.5 text-purple-300" />
                  <span>Price History</span>
                </Link>
                <Link
                  to="/price-alerts"
                  className="py-2 px-3 rounded-xl bg-white hover:bg-purple-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-center gap-1 transition"
                >
                  <Bell className="w-3.5 h-3.5 text-purple-600" />
                  <span>Set Alert</span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200 text-center">
              <div className="flex flex-col items-center gap-1 text-[11px] text-slate-500">
                <Truck className="w-4 h-4 text-purple-600" />
                <span>Fast Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-[11px] text-slate-500">
                <Shield className="w-4 h-4 text-purple-600" />
                <span>1-Year Warranty</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-[11px] text-slate-500">
                <RefreshCw className="w-4 h-4 text-purple-600" />
                <span>7-Day Return</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Table */}
      {Object.keys(specsObj).length > 0 && (
        <section className="bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" />
            <span>Technical Specifications</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 pt-2">
            {Object.entries(specsObj).map(([key, value]) => (
              <div key={key} className="flex justify-between py-2 border-b border-slate-100 text-xs">
                <span className="font-semibold text-slate-500">{key}</span>
                <span className="font-bold text-slate-800 text-right">{value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI REVIEW SYNTHESIS (GEMINI) & CUSTOMER REVIEWS */}
      <section className="bg-white rounded-3xl border border-slate-200 p-8 space-y-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Generative AI Synthesis
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Customer Reviews & AI Insights</h3>
        </div>

        {/* Gemini AI Review Summary Box */}
        {reviewSummary && (
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Google Gemini Review Analysis</h4>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-600 text-white">
                AI Summary
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              "{reviewSummary.ai_summary || `Shoppers highlight the stellar build quality, dependable performance, and high value proposition of ${product.name}.`}"
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-emerald-200/60 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Key Advantages (Pros)</span>
                </div>
                <ul className="space-y-1 text-xs text-slate-600">
                  {reviewSummary.key_pros.map((pro, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-rose-200/60 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                  <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
                  <span>Considerations (Cons)</span>
                </div>
                <ul className="space-y-1 text-xs text-slate-600">
                  {reviewSummary.key_cons.map((con, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Submit Review Form */}
        <div className="border-t border-slate-100 pt-6 space-y-4">
          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
            <MessageSquarePlus className="w-4 h-4 text-purple-600" />
            <span>Write a Verified Customer Review</span>
          </h4>

          {isAuthenticated ? (
            <form onSubmit={handleSubmitReview} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Rating:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= newRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your experience with this product..."
                rows={3}
                required
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-purple-600 transition"
              />

              <button
                type="submit"
                disabled={submittingReview}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition"
              >
                {submittingReview ? 'Submitting...' : 'Post Review'}
              </button>
            </form>
          ) : (
            <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <span>Please sign in to share a verified customer review.</span>
              <Link to="/login" className="font-bold text-purple-600 hover:underline">
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Reviews List */}
        <div className="space-y-4 border-t border-slate-100 pt-6">
          <h4 className="font-bold text-sm text-slate-900">
            All Reviews ({reviews.length})
          </h4>
          {reviews.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No customer reviews yet. Be the first to review this product!</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">{r.user_name || 'Verified Customer'}</span>
                    <div className="flex items-center text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span className="text-xs font-bold text-slate-800 ml-1">{r.rating}★</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">{r.comment}</p>
                  <span className="text-[10px] text-slate-400 block pt-1">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* RELATED AI RECOMMENDATIONS (SCIKIT-LEARN ENGINE) */}
      {similarProducts.length > 0 && (
        <section className="space-y-6">
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Content-Based Cosine Similarity
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Similar Products You Might Like</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
