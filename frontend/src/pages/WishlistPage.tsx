import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export const WishlistPage: React.FC = () => {
  const { wishlistProducts, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { success } = useToast();

  if (wishlistProducts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Your Wishlist is Empty</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Save your favorite products while browsing so you can easily review and purchase them later!
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-bold transition shadow-sm"
        >
          <span>Explore Products</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Saved Wishlist ({wishlistProducts.length} items)
        </h1>
        <p className="text-xs text-slate-500 mt-1">Easily move your saved items directly to the shopping cart</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlistProducts.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-lg transition flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-3">
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                <button
                  onClick={() => {
                    removeFromWishlist(p.id);
                    success('Removed from wishlist');
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white text-rose-500 rounded-full shadow-sm transition"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block mb-1">
                {p.category?.name || 'Catalog'}
              </span>
              <Link
                to={`/products/${p.slug || p.id}`}
                className="font-semibold text-xs text-slate-900 hover:text-purple-600 line-clamp-2"
              >
                {p.name}
              </Link>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 space-y-3">
              <span className="text-sm font-extrabold text-slate-900 block">
                ₹{p.price.toLocaleString('en-IN')}
              </span>
              <button
                onClick={async () => {
                  await addToCart(p, 1);
                  await removeFromWishlist(p.id);
                  success(`Moved "${p.name}" to cart!`);
                }}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Move to Cart</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
