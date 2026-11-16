import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, ShoppingBag, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { Order } from '../types';

export const MyOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.getMyOrders();
        setOrders(data);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-inner">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">No Orders Placed Yet</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          You haven't completed any purchases yet. Explore our AI-curated catalog to find top gear!
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-bold transition shadow-sm"
        >
          <span>Browse Products</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Order History</h1>
        <p className="text-xs text-slate-500 mt-1">Track status and review invoices of past purchases</p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:border-purple-200 transition space-y-4"
          >
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono font-bold text-slate-800 text-sm">{order.order_number}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  order.status === 'delivered'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : order.status === 'cancelled'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}>
                  {order.status}
                </span>
                <span className="text-sm font-black text-slate-900">
                  ₹{order.total_amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Items row */}
            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    {item.product_image && (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
                      />
                    )}
                    <div>
                      <span className="font-bold text-slate-800 line-clamp-1">{item.product_name}</span>
                      <span className="text-[11px] text-slate-400">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <span className="font-semibold text-slate-800">₹{item.subtotal.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-end">
              <Link
                to={`/order-confirmation/${order.order_number}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700"
              >
                <span>View Full Invoice & Details</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
