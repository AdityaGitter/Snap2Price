import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, ShoppingCart, Heart, Search, User, LogOut,
  Layers, Camera, Bot, ShieldCheck, Menu, X, ArrowRight,
  Tag, Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export const Navbar: React.FC<{ onOpenAIChat?: () => void }> = ({ onOpenAIChat }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const { wishlistIds } = useWishlist();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 transition-all">
      {/* Top Banner: College Demo / AI Notice */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 text-white text-xs font-medium py-1.5 px-4 text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 animate-pulse text-yellow-300" />
        <span>ShopSmart AI – Final-Year DevOps Project with Google Gemini & Scikit-Learn</span>
        <span className="hidden md:inline-block bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Academic Demo</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-purple-600 transition-colors">
                ShopSmart <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">AI</span>
              </span>
            </div>
          </Link>

          {/* Search Bar with AI Badge */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-lg relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands, or try: 'laptops under 50000'..."
              className="w-full bg-slate-100 hover:bg-slate-50 focus:bg-white text-slate-800 text-sm pl-10 pr-24 py-2.5 rounded-full border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <Link
              to="/visual-search"
              className="absolute right-2 top-1.5 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-full flex items-center gap-1 transition"
              title="Search by image upload"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Visual</span>
            </Link>
          </form>

          {/* Quick Nav Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Snap2Price Comparison Link */}
            <Link
              to="/price-comparison"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all"
              title="Multi-Platform Price Comparison (Snap2Price)"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Compare Prices</span>
            </Link>

            {/* AI Assistant Button */}
            <button
              onClick={onOpenAIChat}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm hover:shadow-purple-500/30 hover:scale-105 transition-all"
            >
              <Bot className="w-4 h-4" />
              <span>Ask AI</span>
            </button>

            {/* Price Alerts Link */}
            <Link
              to="/price-alerts"
              className="p-2 text-slate-600 hover:text-purple-600 hover:bg-slate-100 rounded-full transition relative hidden sm:flex"
              title="Price Drop Alerts"
            >
              <Bell className="w-5 h-5" />
            </Link>

            {/* Compare Link */}
            <Link
              to="/compare"
              className="p-2 text-slate-600 hover:text-purple-600 hover:bg-slate-100 rounded-full transition relative hidden sm:flex"
              title="Product Comparison"
            >
              <Layers className="w-5 h-5" />
            </Link>

            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              className="p-2 text-slate-600 hover:text-purple-600 hover:bg-slate-100 rounded-full transition relative"
              title="My Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistIds.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {wishlistIds.length}
                </span>
              )}
            </Link>

            {/* Cart Link */}
            <Link
              to="/cart"
              className="p-2 text-slate-600 hover:text-purple-600 hover:bg-slate-100 rounded-full transition relative"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-purple-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User Account Dropdown */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm border border-purple-200">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 text-sm animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-semibold text-slate-800 truncate">{user?.full_name}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                        {user?.role}
                      </span>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50"
                    >
                      <ShoppingCart className="w-4 h-4 text-slate-400" />
                      <span>My Orders</span>
                    </Link>

                    <Link
                      to="/price-alerts"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50"
                    >
                      <Bell className="w-4 h-4 text-purple-600" />
                      <span>Price Drop Alerts</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-purple-700 font-medium hover:bg-purple-50"
                      >
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 border-t border-slate-100 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="ml-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-slate-900 text-white hover:bg-purple-700 transition"
              >
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 space-y-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-slate-100 text-sm pl-10 pr-4 py-2 rounded-full border border-slate-200 outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            </form>

            <div className="flex flex-col gap-2 pt-2">
              <Link
                to="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium text-sm"
              >
                Browse All Products
              </Link>
              <Link
                to="/visual-search"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium text-sm flex items-center gap-2"
              >
                <Camera className="w-4 h-4 text-purple-600" />
                <span>AI Visual Search</span>
              </Link>
              <Link
                to="/price-comparison"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-emerald-700 hover:bg-emerald-50 rounded-lg font-semibold text-sm flex items-center gap-2"
              >
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>Compare Retailer Prices</span>
              </Link>
              <Link
                to="/price-alerts"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium text-sm flex items-center gap-2"
              >
                <Bell className="w-4 h-4 text-purple-600" />
                <span>Price Drop Alerts</span>
              </Link>
              <Link
                to="/recommendations"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium text-sm flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>AI Recommendations</span>
              </Link>
              <Link
                to="/compare"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium text-sm flex items-center gap-2"
              >
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Product Comparison</span>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAIChat?.();
                }}
                className="px-3 py-2 text-purple-700 hover:bg-purple-50 rounded-lg font-semibold text-sm flex items-center gap-2 text-left"
              >
                <Bot className="w-4 h-4 text-purple-600" />
                <span>AI Shopping Assistant</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
