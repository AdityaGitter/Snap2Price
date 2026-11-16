import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2, Package, MapPin, CreditCard, ArrowRight,
  Printer, ShoppingBag, Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Order } from '../types';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNumber) return;
    const fetchOrder = async () => {
      try {
        const data = await api.getOrder(orderNumber);
        setOrder(data);
      } catch (err) {
        console.error('Failed to load order', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Order #{orderNumber} Not Found</h2>
        <Link to="/products" className="inline-block px-5 py-2.5 bg-purple-600 text-white rounded-full text-xs font-bold">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Confirmation Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Order Confirmed!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thank you for shopping with ShopSmart AI. Your order is being processed.
          </p>
        </div>

        <div className="inline-block bg-purple-50 border border-purple-200 rounded-2xl px-5 py-2.5 text-xs">
          <span className="text-slate-500 font-medium">Order Reference: </span>
          <span className="font-mono font-extrabold text-purple-700">{order.order_number}</span>
        </div>
      </div>

      {/* Order Details & Items Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-sm text-slate-900">Ordered Items ({order.items.length})</h3>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
            {order.status}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {order.items.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {item.product_image && (
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
                  />
                )}
                <div>
                  <span className="font-bold text-xs text-slate-900 line-clamp-1">{item.product_name}</span>
                  <span className="text-[11px] text-slate-500">Qty: {item.quantity} × ₹{item.product_price.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <span className="text-xs font-extrabold text-slate-900">
                ₹{item.subtotal.toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>

        {/* Pricing Summary */}
        <div className="border-t border-slate-100 pt-4 space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Discount Applied</span>
              <span>-₹{order.discount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>18% GST</span>
            <span>₹{order.tax.toLocaleString('en-IN')}</span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
            <span>Total Paid (Simulated)</span>
            <span className="text-purple-700">₹{order.total_amount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Delivery & Payment Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 space-y-1">
            <span className="font-bold text-slate-700 flex items-center gap-1.5 mb-1">
              <MapPin className="w-3.5 h-3.5 text-purple-600" />
              <span>Delivery Address</span>
            </span>
            <p className="text-slate-600">{order.shipping_address}</p>
            <p className="text-slate-600">{order.shipping_city}, {order.shipping_postal_code}, {order.shipping_country}</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 space-y-1">
            <span className="font-bold text-slate-700 flex items-center gap-1.5 mb-1">
              <CreditCard className="w-3.5 h-3.5 text-purple-600" />
              <span>Payment Details</span>
            </span>
            <p className="text-slate-600 font-mono">TXN: {order.payment?.transaction_id || 'SIM-TXN-OK'}</p>
            <p className="text-emerald-600 font-semibold uppercase text-[10px]">Method: {order.payment?.payment_method || 'Virtual Card'}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/products"
          className="w-full sm:w-auto px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Shop More Items</span>
        </Link>
        <Link
          to="/orders"
          className="w-full sm:w-auto px-6 py-3 rounded-full bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-bold text-xs transition flex items-center justify-center gap-2"
        >
          <span>View All My Orders</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
