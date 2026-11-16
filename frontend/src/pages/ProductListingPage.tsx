import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Filter, Search, X, Sparkles, SlidersHorizontal, ArrowUpDown,
  Check, Layers
} from 'lucide-react';
import { api } from '../services/api';
import { Product, Category, SmartSearchResponse } from '../types';
import { ProductCard } from '../components/ProductCard';
import { CardGridSkeleton } from '../components/LoadingSkeleton';

export const ProductListingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter states
  const searchParam = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';
  const brandParam = searchParams.get('brand') || '';
  const minPriceParam = searchParams.get('min_price') || '';
  const maxPriceParam = searchParams.get('max_price') || '';
  const minRatingParam = searchParams.get('min_rating') || '';
  const sortByParam = searchParams.get('sort_by') || 'newest';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [aiInterpretation, setAiInterpretation] = useState<SmartSearchResponse | null>(null);
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [cats, brandList] = await Promise.all([
          api.getCategories(),
          api.getBrands(),
        ]);
        setCategories(cats);
        setBrands(brandList);
      } catch (err) {
        console.error('Failed to load filter metadata', err);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // If search looks like natural language query, try smart search
        if (searchParam && (searchParam.includes('under') || searchParam.includes('cheap') || searchParam.includes('for') || searchParam.includes('best'))) {
          try {
            const aiRes = await api.smartSearch(searchParam);
            setAiInterpretation(aiRes);
            setProducts(aiRes.results);
            setTotal(aiRes.total);
            setLoading(false);
            return;
          } catch {
            // fallback to standard API
          }
        } else {
          setAiInterpretation(null);
        }

        const data = await api.getProducts({
          page: pageParam,
          page_size: 12,
          search: searchParam || undefined,
          category: categoryParam || undefined,
          brand: brandParam || undefined,
          min_price: minPriceParam ? parseFloat(minPriceParam) : undefined,
          max_price: maxPriceParam ? parseFloat(maxPriceParam) : undefined,
          min_rating: minRatingParam ? parseFloat(minRatingParam) : undefined,
          sort_by: sortByParam,
        });

        setProducts(data.items);
        setTotal(data.total);
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  const updateFilters = (newParams: Record<string, string | null>) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === null || v === '') {
        updated.delete(k);
      } else {
        updated.set(k, v);
      }
    });
    updated.set('page', '1');
    setSearchParams(updated);
  };

  const handleToggleCompare = (product: Product) => {
    setComparedProducts((prev) => {
      if (prev.some((p) => p.id === product.id)) {
        return prev.filter((p) => p.id !== product.id);
      } else {
        if (prev.length >= 4) {
          alert('You can compare at most 4 products side by side.');
          return prev;
        }
        return [...prev, product];
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* AI Smart Search Explanation Banner */}
      {aiInterpretation && (
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">Gemini Natural Language Search</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-600 text-white">
                Active Interpretation
              </span>
            </div>
            <p className="text-slate-600 text-xs mt-1">{aiInterpretation.ai_explanation}</p>
          </div>
          <button
            onClick={() => updateFilters({ search: null })}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {categoryParam
              ? categories.find((c) => c.slug === categoryParam)?.name || 'Products'
              : searchParam
              ? `Results for "${searchParam}"`
              : 'All Products'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Showing {products.length} of {total} products</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortByParam}
              onChange={(e) => updateFilters({ sort_by: e.target.value })}
              className="text-xs font-medium bg-transparent text-slate-700 outline-none cursor-pointer"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="popularity">Most Popular</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Sidebar + Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside
          className={`md:block space-y-6 ${
            mobileFilterOpen ? 'block' : 'hidden'
          }`}
        >
          {/* Active Filter Pills */}
          {(categoryParam || brandParam || minPriceParam || maxPriceParam || minRatingParam) && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Active Filters</span>
                <button
                  onClick={() => updateFilters({ category: null, brand: null, min_price: null, max_price: null, min_rating: null })}
                  className="text-xs text-purple-600 hover:underline font-semibold"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {categoryParam && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-200">
                    Category: {categoryParam}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ category: null })} />
                  </span>
                )}
                {brandParam && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-200">
                    Brand: {brandParam}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilters({ brand: null })} />
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Category Filter */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Categories</h3>
            <div className="space-y-1.5">
              <button
                onClick={() => updateFilters({ category: null })}
                className={`w-full text-left text-xs py-1.5 px-2 rounded-lg transition flex items-center justify-between ${
                  !categoryParam ? 'bg-purple-50 text-purple-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>All Categories</span>
                <span>{categories.reduce((acc, c) => acc + (c.product_count || 8), 0)}</span>
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => updateFilters({ category: c.slug })}
                  className={`w-full text-left text-xs py-1.5 px-2 rounded-lg transition flex items-center justify-between ${
                    categoryParam === c.slug ? 'bg-purple-50 text-purple-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="text-[11px] text-slate-400">{c.product_count || 8}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Price Range (₹)</h3>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min ₹"
                value={minPriceParam}
                onChange={(e) => updateFilters({ min_price: e.target.value || null })}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 outline-none"
              />
              <input
                type="number"
                placeholder="Max ₹"
                value={maxPriceParam}
                onChange={(e) => updateFilters({ max_price: e.target.value || null })}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1 pt-1 text-xs text-slate-500">
              <button onClick={() => updateFilters({ min_price: '0', max_price: '5000' })} className="text-left hover:text-purple-600">Under ₹5,000</button>
              <button onClick={() => updateFilters({ min_price: '5000', max_price: '25000' })} className="text-left hover:text-purple-600">₹5,000 - ₹25,000</button>
              <button onClick={() => updateFilters({ min_price: '25000', max_price: '100000' })} className="text-left hover:text-purple-600">₹25,000 - ₹1,00,000</button>
              <button onClick={() => updateFilters({ min_price: '100000', max_price: null })} className="text-left hover:text-purple-600">Above ₹1,00,000</button>
            </div>
          </div>

          {/* Brands Filter */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Brands</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {brands.map((b) => (
                <button
                  key={b}
                  onClick={() => updateFilters({ brand: brandParam === b ? null : b })}
                  className={`w-full text-left text-xs py-1.5 px-2 rounded-lg transition flex items-center justify-between ${
                    brandParam === b ? 'bg-purple-50 text-purple-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{b}</span>
                  {brandParam === b && <Check className="w-3.5 h-3.5 text-purple-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum Rating */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Customer Rating</h3>
            {[4.5, 4.0, 3.5].map((stars) => (
              <button
                key={stars}
                onClick={() => updateFilters({ min_rating: minRatingParam === stars.toString() ? null : stars.toString() })}
                className={`w-full text-left text-xs py-1.5 px-2 rounded-lg transition flex items-center gap-1.5 ${
                  minRatingParam === stars.toString() ? 'bg-purple-50 text-purple-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>★ {stars} & above</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="md:col-span-3 space-y-6">
          {loading ? (
            <CardGridSkeleton count={9} />
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No matching products found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try widening your price range, searching for another keyword, or resetting active filters.
              </p>
              <button
                onClick={() => updateFilters({ category: null, brand: null, min_price: null, max_price: null, min_rating: null, search: null })}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-full text-xs font-bold hover:bg-purple-700 transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onToggleCompare={handleToggleCompare}
                  isCompared={comparedProducts.some((cp) => cp.id === p.id)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > 12 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                disabled={pageParam <= 1}
                onClick={() => updateFilters({ page: (pageParam - 1).toString() })}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold disabled:opacity-40 hover:bg-white transition"
              >
                Previous
              </button>
              <span className="text-xs text-slate-600 px-3">
                Page {pageParam} of {Math.ceil(total / 12)}
              </span>
              <button
                disabled={pageParam >= Math.ceil(total / 12)}
                onClick={() => updateFilters({ page: (pageParam + 1).toString() })}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold disabled:opacity-40 hover:bg-white transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Compare Action Bar if items selected */}
      {comparedProducts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold">{comparedProducts.length} selected to compare</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const ids = comparedProducts.map((p) => p.id).join(',');
                navigate(`/compare?ids=${ids}`);
              }}
              className="px-4 py-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-sm"
            >
              Compare Now
            </button>
            <button
              onClick={() => setComparedProducts([])}
              className="p-1 hover:bg-white/20 rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
