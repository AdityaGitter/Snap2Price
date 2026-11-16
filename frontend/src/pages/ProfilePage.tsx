import React from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Shield, Calendar, ShoppingBag, Heart, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

export const ProfilePage: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { wishlistIds } = useWishlist();
  const { totalItems } = useCart();

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">User Account Profile</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your account details and view platform stats</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm space-y-8">
        {/* User Card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            {user.full_name.charAt(0)}
          </div>
          <div className="space-y-1 text-center sm:text-left flex-1">
            <h2 className="text-xl font-bold text-slate-900">{user.full_name}</h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-purple-600" />
                <span>{user.email}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Member since {new Date(user.created_at).toLocaleDateString()}</span>
              </span>
            </div>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold uppercase rounded-full">
                Role: {user.role}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <Link
            to="/cart"
            className="p-5 bg-slate-50 hover:bg-purple-50/50 rounded-2xl border border-slate-200 transition group space-y-1"
          >
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Items in Cart</span>
            <span className="text-2xl font-black text-slate-900 group-hover:text-purple-600 transition">
              {totalItems}
            </span>
          </Link>

          <Link
            to="/wishlist"
            className="p-5 bg-slate-50 hover:bg-purple-50/50 rounded-2xl border border-slate-200 transition group space-y-1"
          >
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Saved in Wishlist</span>
            <span className="text-2xl font-black text-slate-900 group-hover:text-purple-600 transition">
              {wishlistIds.length}
            </span>
          </Link>

          <Link
            to="/orders"
            className="p-5 bg-slate-50 hover:bg-purple-50/50 rounded-2xl border border-slate-200 transition group space-y-1"
          >
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Order History</span>
            <span className="text-xs font-bold text-purple-600 flex items-center gap-1 mt-2">
              <span>View Past Orders</span>
              <ShoppingBag className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>

        {/* Admin Navigation Banner if user is Admin */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-bold text-sm">Administrator Access Granted</h3>
              <p className="text-xs text-purple-200">Manage products inventory, customer orders, users and analytics.</p>
            </div>
            <Link
              to="/admin"
              className="px-5 py-2.5 bg-white text-purple-900 font-bold text-xs rounded-xl hover:bg-purple-50 transition shadow-sm flex-shrink-0"
            >
              Open Admin Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
