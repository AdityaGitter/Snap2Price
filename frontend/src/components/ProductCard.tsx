import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Check, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';

interface ProductCardProps {
  product: Product;
  onToggleCompare?: (product: Product) => void;
  isCompared?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onToggleCompare,
  isCompared = false,
}) => {
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { success } = useToast();

  const inWishlist = isInWishlist(product.id);

  const discountPercent = product.original_price && product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product, 1);
    success(`Added "${product.name}" to cart!`);
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      await removeFromWishlist(product.id);
      success(`Removed from wishlist`);
    } else {
      await addToWishlist(product);
      success(`Saved "${product.name}" to wishlist!`);
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Top badges & Wishlist */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex flex-col gap-1">
          {product.is_featured && (
            <span className="inline-flex items-center gap-1 bg-purple-600 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shadow-sm">
              <Sparkles className="w-2.5 h-2.5" /> Featured
            </span>
          )}
          {discountPercent && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        <button
          onClick={handleToggleWishlist}
          className={`pointer-events-auto p-2 rounded-full backdrop-blur-md transition shadow-sm ${
            inWishlist
              ? 'bg-rose-50 text-rose-500 hover:bg-rose-100'
              : 'bg-white/80 text-slate-500 hover:text-rose-500 hover:bg-white'
          }`}
          title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${inWishlist ? 'fill-rose-500' : ''}`} />
        </button>
      </div>

      {/* Product Image */}
      <Link to={`/products/${product.slug || product.id}`} className="block relative aspect-square overflow-hidden bg-slate-100">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {product.stock <= 5 && product.stock > 0 && (
          <div className="absolute bottom-2 left-2 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
            Only {product.stock} left in stock!
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Brand */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium text-purple-700 uppercase tracking-wider text-[10px]">
              {product.category?.name || 'Catalog'}
            </span>
            {product.brand && <span className="font-semibold text-slate-600">{product.brand}</span>}
          </div>

          {/* Product Name */}
          <Link
            to={`/products/${product.slug || product.id}`}
            className="block font-semibold text-slate-900 text-sm hover:text-purple-700 transition line-clamp-2 leading-snug mb-2"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span className="text-xs font-bold text-slate-800 ml-1">{product.rating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-slate-400">({product.review_count})</span>
          </div>
        </div>

        {/* Price & Action */}
        <div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-extrabold text-slate-900">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-xs text-slate-400 line-through">
                ₹{product.original_price.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition ${
                product.stock === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow-purple-500/20 active:scale-98'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </button>

            {onToggleCompare && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleCompare(product);
                }}
                className={`p-2 rounded-xl border text-xs font-medium transition ${
                  isCompared
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
                title="Compare product"
              >
                {isCompared ? <Check className="w-4 h-4" /> : <span className="text-[11px] font-bold">VS</span>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
