import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Trash2, ArrowRight, Tag, ShieldCheck,
  Sparkles, ArrowLeft
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export const CartPage: React.FC = () => {
  const {
    items,
    subtotal,
    totalItems,
    discountAmount,
    taxAmount,
    totalAmount,
    couponCode,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [inputCoupon, setInputCoupon] = useState('');
  const [applying, setApplying] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    setApplying(true);
    const res = await applyCoupon(inputCoupon.trim());
    if (res.success) {
      success(res.message);
      setInputCoupon('');
    } else {
      error(res.message);
    }
    setApplying(false);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-inner">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Your Shopping Cart is Empty</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Explore our smart AI-curated catalog to discover flagship laptops, smartphones, fashion, and home gear.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-bold shadow-md shadow-purple-500/20 transition"
        >
          <span>Start Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Shopping Cart ({totalItems} items)
          </h1>
          <p className="text-xs text-slate-500 mt-1">Review your selected items and apply coupons before checkout</p>
        </div>
        <Link
          to="/products"
          className="text-xs font-semibold text-purple-600 hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4 divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.id} className="pt-4 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={item.product?.image_url}
                  alt={item.product?.name}
                  className="w-20 h-20 rounded-2xl object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
                />
                <div>
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                    {item.product?.category?.name || 'Department'}
                  </span>
                  <Link
                    to={`/products/${item.product?.slug || item.product?.id}`}
                    className="font-bold text-sm text-slate-900 hover:text-purple-600 transition line-clamp-1"
                  >
                    {item.product?.name}
                  </Link>
                  <span className="text-xs font-extrabold text-slate-900 block mt-1">
                    ₹{(item.product?.price || 0).toLocaleString('en-IN')} each
                  </span>
                </div>
              </div>

              {/* Quantity Counter & Total */}
              <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 font-bold transition"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-bold text-slate-900 min-w-6 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 font-bold transition"
                  >
                    +
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-slate-900 block">
                    ₹{((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Coupon Box */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-purple-600" />
              <span>Have a Coupon Code?</span>
            </h3>

            {couponCode ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>{couponCode} Applied</span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs text-rose-600 font-bold hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. SMART10"
                  value={inputCoupon}
                  onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 uppercase font-semibold outline-none focus:border-purple-600 transition"
                />
                <button
                  type="submit"
                  disabled={applying || !inputCoupon.trim()}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-bold transition flex-shrink-0"
                >
                  Apply
                </button>
              </form>
            )}
            <p className="text-[11px] text-slate-400">
              Try discount codes: <strong className="text-purple-600">SMART10</strong> (10% off) or <strong className="text-purple-600">WELCOME15</strong>
            </p>
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Order Summary</h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal ({totalItems} items)</span>
                <span className="font-bold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount ({couponCode})</span>
                  <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Estimated Tax (18% GST)</span>
                <span className="font-bold text-slate-900">₹{taxAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Shipping & Handling</span>
                <span className="font-bold text-emerald-600">FREE</span>
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-black text-slate-900">
                <span>Grand Total</span>
                <span className="text-purple-700">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-lg shadow-purple-500/20 active:scale-98 transition flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Simulated Payment Gateway Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
