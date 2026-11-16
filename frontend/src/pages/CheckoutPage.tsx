import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCard, ShieldCheck, AlertCircle, ArrowRight,
  MapPin, CheckCircle2, AlertTriangle, ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export const CheckoutPage: React.FC = () => {
  const { items, subtotal, discountAmount, taxAmount, totalAmount, couponCode, clearCart } = useCart();
  const { error } = useToast();
  const navigate = useNavigate();

  const [address, setAddress] = useState('42 Tech Boulevard, Silicon Campus');
  const [city, setCity] = useState('Bengaluru');
  const [postalCode, setPostalCode] = useState('560100');
  const [paymentMethod, setPaymentMethod] = useState('simulated_card');
  const [submitting, setSubmitting] = useState(false);
  const [simulatedError, setSimulatedError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">No items to checkout</h2>
        <Link to="/products" className="inline-block px-5 py-2.5 bg-purple-600 text-white rounded-full text-xs font-bold">
          Browse Products
        </Link>
      </div>
    );
  }

  const handleCheckout = async (simulateFailure: boolean = false) => {
    if (!address || !city || !postalCode) {
      error('Please fill in complete shipping address information.');
      return;
    }

    setSubmitting(true);
    setSimulatedError(null);

    try {
      const order = await api.checkout({
        shipping_address: address,
        shipping_city: city,
        shipping_postal_code: postalCode,
        shipping_country: 'India',
        coupon_code: couponCode || undefined,
        payment_method: paymentMethod,
        simulate_failure: simulateFailure,
      });

      await clearCart();
      navigate(`/order-confirmation/${order.order_number}`);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Simulated transaction failed.';
      setSimulatedError(msg);
      error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Checkout & Payment</h1>
          <p className="text-xs text-slate-500 mt-1">Academic Simulation Environment • Fast & Secure</p>
        </div>
        <Link to="/cart" className="text-xs font-semibold text-purple-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cart</span>
        </Link>
      </div>

      {/* Academic Disclaimer Alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Academic Demonstration Notice</span>
          <span>
            This application implements a simulated payment gateway. No real credit cards, bank accounts, or financial charges are processed.
          </span>
        </div>
      </div>

      {simulatedError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-900 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Payment Simulation Error</span>
            <span>{simulatedError}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left: Shipping & Payment Form */}
        <div className="md:col-span-7 space-y-6">
          {/* Shipping Details */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-600" />
              <span>Shipping Information</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-600 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-600 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-600" />
              <span>Select Payment Method (Simulation)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'simulated_card', label: 'Credit / Debit Card' },
                { id: 'simulated_upi', label: 'UPI / QR Code' },
                { id: 'simulated_netbanking', label: 'Net Banking' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`p-3 rounded-2xl border text-left text-xs transition ${
                    paymentMethod === m.id
                      ? 'border-purple-600 bg-purple-50/60 text-purple-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="block truncate">{m.label}</span>
                </button>
              ))}
            </div>

            {/* Simulated Card Preview */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md space-y-4">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>ShopSmart AI Virtual Card</span>
                <span className="font-black text-amber-400">ACADEMIC</span>
              </div>
              <div className="text-lg font-mono tracking-widest text-slate-200">
                •••• •••• •••• 9812
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Cardholder</span>
                  <span>Demo Student</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Expires</span>
                  <span>12/28</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Summary & Simulation Action Buttons */}
        <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <h3 className="font-extrabold text-base text-slate-900">Total Breakdown</h3>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal ({items.length} items)</span>
              <span className="font-bold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Discount ({couponCode})</span>
                <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>GST (18%)</span>
              <span className="font-bold text-slate-900">₹{taxAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between text-base font-black text-slate-900">
              <span>Amount Payable</span>
              <span className="text-purple-700">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Action Simulation Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => handleCheckout(false)}
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold text-sm shadow-lg shadow-purple-500/20 active:scale-98 transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simulate Successful Payment</span>
            </button>

            <button
              onClick={() => handleCheckout(true)}
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Simulate Payment Decline (Demo Failure Case)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted with 256-bit SSL Simulation</span>
          </div>
        </div>
      </div>
    </div>
  );
};
