import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, ArrowLeft, Search, CheckCircle2, Clock,
  Truck, XCircle, Eye
} from 'lucide-react';
import { api } from '../../services/api';
import { Order } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { success, error } = useToast();

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminOrders();
      setOrders(data);
    } catch (err) {
      error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      success(`Updated order status to "${newStatus}"!`);
      loadOrders();
    } catch (err) {
      error('Failed to update status');
    }
  };

  const filtered = orders.filter(
    (o) =>
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.shipping_city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/admin" className="text-slate-400 hover:text-slate-600">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Order Fulfillment & Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Review live transactions and update shipping statuses</p>
        </div>

        <button
          onClick={loadOrders}
          className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition shadow-xs"
        >
          Refresh Orders
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order number or city..."
          className="w-full text-xs text-slate-800 outline-none bg-transparent"
        />
        <span className="text-xs text-slate-400 whitespace-nowrap">{filtered.length} orders</span>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status & Action</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-purple-700">{order.order_number}</td>
                  <td className="py-3.5 px-4 text-slate-500">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{order.shipping_city}, {order.shipping_postal_code}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-600">{order.items?.length || 0} items</td>
                  <td className="py-3.5 px-4 font-black text-slate-900">₹{order.total_amount.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border outline-none cursor-pointer transition ${
                        order.status === 'delivered'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : order.status === 'shipped'
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : order.status === 'cancelled'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-indigo-50 text-indigo-800 border-indigo-300'
                      }`}
                    >
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                Order #{selectedOrder.order_number}
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-1">
                <span className="font-bold text-slate-700 block">Shipping Destination</span>
                <p className="text-slate-600">{selectedOrder.shipping_address}, {selectedOrder.shipping_city} - {selectedOrder.shipping_postal_code}</p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">Items Purchased:</span>
                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="py-2 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900 block">{item.product_name}</span>
                        <span className="text-[10px] text-slate-400">Qty: {item.quantity} × ₹{item.product_price.toLocaleString('en-IN')}</span>
                      </div>
                      <span className="font-bold text-slate-900">₹{item.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                <span>Grand Total</span>
                <span className="text-purple-700">₹{selectedOrder.total_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
