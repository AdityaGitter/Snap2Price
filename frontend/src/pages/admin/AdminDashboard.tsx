import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, ShoppingBag, Package, DollarSign, AlertTriangle,
  TrendingUp, ArrowRight, ShieldCheck, Layers, Eye
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar, Cell
} from 'recharts';
import { api } from '../../services/api';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getAdminStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₹${(stats.total_revenue || 0).toLocaleString('en-IN')}`,
      sub: 'Simulated Order Revenue',
      icon: DollarSign,
      color: 'bg-emerald-500',
    },
    {
      title: 'Total Orders',
      value: stats.total_orders,
      sub: `${stats.pending_orders} pending fulfillment`,
      icon: ShoppingBag,
      color: 'bg-purple-600',
    },
    {
      title: 'Catalog Products',
      value: stats.total_products,
      sub: `${stats.low_stock_products} low stock (<10 units)`,
      icon: Package,
      color: 'bg-indigo-600',
    },
    {
      title: 'Registered Users',
      value: stats.total_users,
      sub: 'Students & Faculty Demo Accounts',
      icon: Users,
      color: 'bg-blue-600',
    },
  ];

  const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Admin Analytics Dashboard
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
              DevOps Node
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Live metrics from PostgreSQL, Redis, and FastAPI Backend</p>
        </div>

        {/* Quick Admin Navigation Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/products"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition shadow-xs"
          >
            Manage Products
          </Link>
          <Link
            to="/admin/orders"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition shadow-xs"
          >
            Manage Orders
          </Link>
          <Link
            to="/admin/users"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition shadow-xs"
          >
            View Users
          </Link>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {card.title}
                </span>
                <div className={`w-9 h-9 rounded-xl ${card.color} text-white flex items-center justify-center shadow-md`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 block">{card.value}</span>
                <span className="text-xs text-slate-400 mt-0.5 block">{card.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Revenue & Order Trends</h3>
              <p className="text-xs text-slate-500">Monthly sales volume across catalog categories</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              +28% vs Last Month
            </span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.sales_trends}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Sales']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Bar */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Products by Category</h3>
            <p className="text-xs text-slate-500">Inventory balance across 6 departments</p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.category_distribution} layout="vertical">
                <XAxis type="number" fontSize={10} stroke="#94a3b8" hide />
                <YAxis dataKey="category" type="category" width={110} fontSize={10} stroke="#64748b" tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} Products`, 'Inventory']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="product_count" radius={[0, 8, 8, 0]}>
                  {stats.category_distribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Recent Customer Orders</h3>
            <p className="text-xs text-slate-500">Latest transactions received across all channels</p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-3 px-2">Order #</th>
                <th className="py-3 px-2">Customer</th>
                <th className="py-3 px-2">Total Amount</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recent_orders.map((o: any) => (
                <tr key={o.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-2 font-mono font-bold text-purple-700">{o.order_number}</td>
                  <td className="py-3 px-2 font-medium text-slate-800">{o.customer}</td>
                  <td className="py-3 px-2 font-bold text-slate-900">₹{o.total.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-slate-400">{new Date(o.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
