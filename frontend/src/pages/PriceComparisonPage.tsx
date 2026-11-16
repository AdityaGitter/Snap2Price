import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, ExternalLink, TrendingDown, ShieldCheck, Star, Truck,
  AlertTriangle, CheckCircle2, Bell, LineChart, Tag, Sparkles,
  ShoppingBag, Info, Award
} from 'lucide-react';
import { api } from '../services/api';
import { ComparableProductSummary, PriceComparisonResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const PriceComparisonPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialProductId = searchParams.get('productId');

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [catalogProducts, setCatalogProducts] = useState<ComparableProductSummary[]>([]);
  const [comparison, setComparison] = useState<PriceComparisonResponse | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingCompare, setLoadingCompare] = useState(false);

  // Quick Price Alert form state
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [alertChannel, setAlertChannel] = useState<'email' | 'aws_sns' | 'in_app'>('email');
  const [creatingAlert, setCreatingAlert] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const { success, error } = useToast();

  useEffect(() => {
    loadComparableCatalog();
  }, []);

  useEffect(() => {
    if (initialProductId) {
      loadComparison({ product_id: Number(initialProductId) });
    } else if (initialQuery) {
      loadComparison({ q: initialQuery });
    } else {
      loadComparison({ product_id: 1 });
    }
  }, [initialProductId, initialQuery]);

  const loadComparableCatalog = async (q?: string) => {
    setLoadingCatalog(true);
    try {
      const res = await api.getComparableProducts({ q: q || undefined, limit: 12 });
      setCatalogProducts(res.items);
    } catch (err) {
      console.error('Failed to load comparable catalog', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const loadComparison = async (params: { product_id?: number; q?: string }) => {
    setLoadingCompare(true);
    try {
      const res = await api.compareRetailerPrices(params);
      setComparison(res);
      if (res.lowest_price_recommendation) {
        setTargetPrice(String(Math.round(res.lowest_price_recommendation.best_price * 0.9)));
      }
    } catch (err: any) {
      error(err?.response?.data?.detail || 'No matching model found across retailers.');
    } finally {
      setLoadingCompare(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSearchParams({ q: searchInput.trim() });
    loadComparableCatalog(searchInput.trim());
    loadComparison({ q: searchInput.trim() });
  };

  const handleSelectProduct = (prodId: number) => {
    setSearchParams({ productId: String(prodId) });
    loadComparison({ product_id: prodId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateQuickAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comparison) return;
    if (!isAuthenticated) {
      error('Please sign in first to set automated price-drop alerts.');
      return;
    }
    const numericTarget = Number(targetPrice);
    if (!numericTarget || numericTarget <= 0) {
      error('Please enter a valid target price in INR.');
      return;
    }
    setCreatingAlert(true);
    try {
      await api.createPriceAlert({
        product_id: comparison.product.id,
        target_price: numericTarget,
        notification_channel: alertChannel,
        notification_target: user?.email,
      });
      success(`Price-drop alert set for ₹${numericTarget.toLocaleString('en-IN')}!`);
      setShowAlertModal(false);
    } catch (err: any) {
      error(err?.response?.data?.detail || 'Failed to create alert');
    } finally {
      setCreatingAlert(false);
    }
  };

  const retailerBrandBadgeColor = (slug: string) => {
    switch (slug) {
      case 'amazon':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'flipkart':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'croma':
        return 'bg-teal-100 text-teal-900 border-teal-300';
      case 'reliance_digital':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header & Search */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-purple-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Snap2Price Multi-Platform Comparison Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Compare Exact-Model Prices Across Major Indian Retailers
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Verify identical product models and specifications across Amazon India, Flipkart, Croma, and Reliance Digital. Spot total landed prices including delivery, track 30-day price history, and jump directly to verified merchant URLs.
          </p>

          <form onSubmit={handleSearchSubmit} className="pt-2 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search model or product (e.g., MacBook Air M3, iPhone 15 Pro, Sony WH-1000XM5)..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white text-slate-900 text-sm font-medium outline-none focus:ring-4 focus:ring-purple-500/40"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 font-bold text-sm text-white shadow-lg transition flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Compare Retailers</span>
            </button>
          </form>
        </div>
      </div>

      {/* Active Product Multi-Platform Comparison Section */}
      {loadingCompare ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-40 bg-slate-100 rounded-2xl" />
        </div>
      ) : comparison ? (
        <div className="space-y-6">
          {/* Honest Data Source Disclosure Banner */}
          <div
            className={`rounded-2xl p-4 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
              comparison.contains_simulated_data
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-start sm:items-center gap-2.5">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-bold block sm:inline mr-1.5">
                  {comparison.contains_simulated_data ? 'Simulated Reference Adapter Notice:' : 'Live Partner Feed Active:'}
                </span>
                <span>{comparison.data_disclaimer}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {comparison.adapter_statuses.map((st) => (
                <span
                  key={st.retailer_slug}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    st.live_api_configured
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                      : 'bg-white border-amber-300 text-amber-800'
                  }`}
                >
                  {st.retailer_name}: {st.live_api_configured ? 'LIVE API' : 'Mock Adapter'}
                </span>
              ))}
            </div>
          </div>

          {/* Product Profile + Exact Model & Specs Card + Lowest Price Spotlight */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Target Product Info */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row gap-6">
              <div className="w-full sm:w-44 h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                <img
                  src={comparison.product.image_url}
                  alt={comparison.product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold">
                    {comparison.product.category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Exact Model: {comparison.canonical_model_number}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {comparison.product.name}
                </h2>

                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <span>
                    Brand: <strong className="text-slate-900">{comparison.product.brand || 'Verified Brand'}</strong>
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {comparison.product.rating.toFixed(1)} ({comparison.product.review_count} reviews)
                  </span>
                </div>

                {/* Normalized Specifications Pills */}
                {Object.keys(comparison.product.specifications || {}).length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Verified Matched Specifications
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(comparison.product.specifications).map(([k, v]) => (
                        <span
                          key={k}
                          className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200"
                        >
                          <strong className="text-slate-900">{k}:</strong> {String(v)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions: History, Alert, Internal Demo Catalog Link */}
                <div className="pt-3 flex flex-wrap gap-2">
                  <Link
                    to={`/price-history/${comparison.product.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                  >
                    <LineChart className="w-3.5 h-3.5 text-purple-300" />
                    <span>30-Day Price History</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowAlertModal(!showAlertModal)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold transition"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Set Price Drop Alert</span>
                  </button>
                  <Link
                    to={`/products/${comparison.product.slug || comparison.product.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                    title="ShopSmart Internal Demo Storefront (Simulated Checkout)"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>ShopSmart Internal Demo Cart</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Lowest-Price Recommendation Box */}
            {comparison.lowest_price_recommendation && (
              <div className="lg:col-span-5 bg-gradient-to-br from-emerald-50 via-teal-50 to-white rounded-3xl border-2 border-emerald-400 p-6 shadow-md flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-extrabold uppercase tracking-wider shadow-sm">
                      <Award className="w-3.5 h-3.5" /> Lowest-Price Winner
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      {comparison.lowest_price_recommendation.retailer_name}
                    </span>
                  </div>

                  <div className="pt-2">
                    <span className="text-xs text-slate-500 font-medium block">Best Total Landed Price</span>
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-3xl font-black text-slate-900">
                        ₹{comparison.lowest_price_recommendation.total_landed_price.toLocaleString('en-IN')}
                      </span>
                      {comparison.lowest_price_recommendation.savings_vs_highest_retailer > 0 && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">
                          Save ₹{comparison.lowest_price_recommendation.savings_vs_highest_retailer.toLocaleString('en-IN')} vs highest retailer
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed pt-1">
                    {comparison.lowest_price_recommendation.recommendation_reason}
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  {comparison.lowest_price_recommendation.url_verified ? (
                    <a
                      href={comparison.lowest_price_recommendation.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition"
                    >
                      <span>Open Best Deal on {comparison.lowest_price_recommendation.retailer_name}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <span className="text-xs text-rose-600 font-semibold block">
                      Retailer URL failed HTTPS verification check.
                    </span>
                  )}
                  <p className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    External Merchant Redirect (Separate from ShopSmart Demo Checkout)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Inline Quick Price Drop Alert Creator */}
          {showAlertModal && (
            <form
              onSubmit={handleCreateQuickAlert}
              className="bg-purple-50 border border-purple-200 rounded-2xl p-5 flex flex-col md:flex-row items-end gap-4 shadow-sm animate-in fade-in"
            >
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-purple-900 mb-1">
                  Target Price (₹) — Current Best: ₹{comparison.lowest_price_recommendation?.best_price.toLocaleString('en-IN')}
                </label>
                <input
                  type="number"
                  min={100}
                  step={50}
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-purple-300 bg-white text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
              </div>

              <div className="w-full md:w-52">
                <label className="block text-xs font-bold text-purple-900 mb-1">Notification Channel</label>
                <select
                  value={alertChannel}
                  onChange={(e) => setAlertChannel(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-purple-300 bg-white text-sm font-medium text-slate-800 outline-none"
                >
                  <option value="email">Email Notification</option>
                  <option value="aws_sns">AWS SNS (SMS / Topic)</option>
                  <option value="in_app">In-App Alert Only</option>
                </select>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  type="submit"
                  disabled={creatingAlert}
                  className="flex-1 md:flex-initial px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold transition"
                >
                  {creatingAlert ? 'Saving...' : 'Activate Price Alert'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAlertModal(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Multi-Retailer Offers Comparison Matrix */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Side-by-Side Retailer Offers ({comparison.retailer_offers.length} Platforms)
                </h3>
                <p className="text-xs text-slate-500">
                  Sorted by total landed price (Item Price + Delivery Charges)
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Model Verified: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">{comparison.canonical_model_number}</code>
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {comparison.retailer_offers.map((offer, index) => {
                const isBest = index === 0 && offer.in_stock;
                return (
                  <div
                    key={offer.id}
                    className={`p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition ${
                      isBest ? 'bg-emerald-50/40' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Retailer Brand + Model Match + Rating */}
                    <div className="space-y-2 lg:w-1/3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold border ${retailerBrandBadgeColor(
                            offer.retailer_slug
                          )}`}
                        >
                          {offer.retailer_name}
                        </span>
                        {isBest && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" /> Lowest Price
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            offer.is_simulated
                              ? 'bg-amber-50 border-amber-200 text-amber-800'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          }`}
                        >
                          {offer.is_simulated ? 'Reference Mock Data' : 'Live Retailer Feed'}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-slate-900">{offer.product_name}</p>

                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        {offer.rating && (
                          <span className="inline-flex items-center gap-1 font-semibold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {offer.rating.toFixed(1)} ({offer.review_count.toLocaleString()} reviews)
                          </span>
                        )}
                        <span className={offer.in_stock ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                          {offer.in_stock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    </div>

                    {/* Delivery & Shipping Info */}
                    <div className="space-y-1 text-xs text-slate-600 lg:w-1/4">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Truck className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <span>
                          {offer.delivery_charge === 0
                            ? 'FREE Delivery'
                            : `+ ₹${offer.delivery_charge.toLocaleString('en-IN')} Delivery Fee`}
                        </span>
                      </div>
                      <p className="text-slate-500 pl-5">{offer.delivery_estimate}</p>
                    </div>

                    {/* Price & Discount Breakdown */}
                    <div className="lg:text-right space-y-1 lg:w-1/5">
                      <div className="flex lg:justify-end items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">
                          ₹{offer.current_price.toLocaleString('en-IN')}
                        </span>
                        {offer.discount_percentage > 0 && (
                          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                            {offer.discount_percentage}% OFF
                          </span>
                        )}
                      </div>
                      {offer.original_price && offer.original_price > offer.current_price && (
                        <span className="text-xs text-slate-400 line-through block">
                          MRP ₹{offer.original_price.toLocaleString('en-IN')}
                        </span>
                      )}
                      {offer.delivery_charge > 0 && (
                        <span className="text-[11px] font-semibold text-slate-600 block">
                          Total Landed: ₹{offer.total_landed_price.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {/* Verified Outbound Purchase Action */}
                    <div className="lg:w-auto flex flex-col items-stretch lg:items-end gap-1.5">
                      {offer.url_verified ? (
                        <a
                          href={offer.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                            isBest
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-slate-900 hover:bg-purple-700 text-white'
                          }`}
                        >
                          <span>Buy on {offer.retailer_name}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                          <AlertTriangle className="w-3.5 h-3.5" /> Unverified Link Blocked
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> {offer.url_verification_note}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Quick Browse Comparable Products Grid */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Browse Popular Multi-Retailer Tracked Products
            </h3>
            <p className="text-xs text-slate-500">
              Click any item below to compare exact-model pricing across all 4 shopping platforms.
            </p>
          </div>
          <Link to="/price-alerts" className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1">
            <Bell className="w-3.5 h-3.5" /> Manage My Price Alerts →
          </Link>
        </div>

        {loadingCatalog ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-52 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {catalogProducts.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectProduct(item.id)}
                className={`text-left bg-white rounded-2xl border p-4 transition flex flex-col justify-between gap-3 hover:shadow-lg ${
                  comparison?.product.id === item.id
                    ? 'border-purple-600 ring-2 ring-purple-100'
                    : 'border-slate-200 hover:border-purple-300'
                }`}
              >
                <div className="flex gap-3 items-start">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase text-purple-700 block truncate">
                      {item.brand || item.category}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                      {item.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{item.model_number}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between w-full">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Lowest ({item.lowest_retailer_name})</span>
                    <span className="text-sm font-black text-emerald-700">
                      ₹{item.lowest_retailer_price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {item.max_savings > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                      <Tag className="w-2.5 h-2.5" /> Save ₹{item.max_savings.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
