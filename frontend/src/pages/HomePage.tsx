import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowRight, Bot, Camera, Layers, Zap, Shield,
  TrendingUp, Award, CheckCircle2, Search, Tag, Bell
} from 'lucide-react';
import { api } from '../services/api';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { CardGridSkeleton } from '../components/LoadingSkeleton';

export const HomePage: React.FC<{ onOpenAIChat?: () => void }> = ({ onOpenAIChat }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [naturalSearchQuery, setNaturalSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, featured, trending] = await Promise.all([
          api.getCategories(),
          api.getFeaturedProducts(8),
          api.getRecommendations('trending'),
        ]);
        setCategories(cats);
        setFeaturedProducts(featured);
        setTrendingProducts(trending.recommendations || featured);
      } catch (err) {
        console.error('Failed to load homepage data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleNaturalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (naturalSearchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(naturalSearchQuery.trim())}`);
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-purple-900/10 via-indigo-900/5 to-transparent pt-12 pb-20 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-spin" />
              <span>Next-Gen E-Commerce with Google Gemini & ML</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.15]">
              Shop Smarter with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600">
                Grounded AI Intelligence
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Experience conversational catalog search, multimodal visual product matching, and personalized TF-IDF recommendation algorithms in a unified modern shopping platform.
            </p>

            {/* Natural Language Search Input Box */}
            <form onSubmit={handleNaturalSearch} className="max-w-2xl mx-auto relative pt-2">
              <div className="relative flex items-center bg-white rounded-full shadow-xl shadow-purple-500/10 border border-slate-200/80 p-1.5 hover:border-purple-400 focus-within:border-purple-600 focus-within:ring-4 focus-within:ring-purple-100 transition-all">
                <Search className="w-5 h-5 text-slate-400 ml-3.5 flex-shrink-0" />
                <input
                  type="text"
                  value={naturalSearchQuery}
                  onChange={(e) => setNaturalSearchQuery(e.target.value)}
                  placeholder="Ask anything: 'Show me affordable laptops under ₹50,000 for college'..."
                  className="w-full text-slate-800 text-sm px-3 py-2 bg-transparent outline-none"
                />
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-5 py-2.5 rounded-full shadow-md shadow-purple-500/30 flex items-center gap-1.5 transition flex-shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Search</span>
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-slate-500">
                <span>Try asking:</span>
                <button
                  type="button"
                  onClick={() => navigate('/products?search=laptops%20under%2050000')}
                  className="text-purple-600 hover:underline"
                >
                  "Laptops under 50k"
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => navigate('/products?search=Sony%20headphones')}
                  className="text-purple-600 hover:underline"
                >
                  "Sony noise-canceling headphones"
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => navigate('/products?category=fitness-lifestyle')}
                  className="text-purple-600 hover:underline"
                >
                  "Smartwatches"
                </button>
              </div>
            </form>

            {/* Action Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-slate-900 text-white hover:bg-purple-700 transition shadow-lg shadow-slate-900/10"
              >
                <span>Explore Full Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={onOpenAIChat}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-white text-purple-700 border border-purple-200 hover:bg-purple-50 transition shadow-sm"
              >
                <Bot className="w-4 h-4 text-purple-600" />
                <span>Chat with Smarty AI</span>
              </button>
              <Link
                to="/visual-search"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition shadow-sm"
              >
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>Visual Photo Search</span>
              </Link>
              <Link
                to="/price-comparison"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20"
              >
                <Tag className="w-4 h-4" />
                <span>Compare Retailer Prices</span>
              </Link>
              <Link
                to="/price-alerts"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 transition shadow-sm"
              >
                <Bell className="w-4 h-4 text-emerald-600" />
                <span>Price Alerts</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Explore Categories</h2>
            <p className="text-xs text-slate-500 mt-1">Discover 48 premium products curated across 6 smart departments</p>
          </div>
          <Link
            to="/products"
            className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1 group"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="group relative rounded-2xl overflow-hidden aspect-square border border-slate-200/80 bg-white hover:shadow-xl transition-all flex flex-col justify-end p-3.5"
            >
              <img
                src={cat.image_url}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              <div className="relative z-10 text-white">
                <h3 className="font-bold text-xs sm:text-sm leading-tight group-hover:text-purple-300 transition-colors">
                  {cat.name}
                </h3>
                <span className="text-[10px] text-slate-300 block mt-0.5">
                  {cat.product_count || 8} items
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Handpicked Highlights
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Featured Products</h2>
          </div>
          <Link
            to="/products"
            className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            <span>See More</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <CardGridSkeleton count={8} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* AI CAPABILITIES SHOWCASE BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
            <Sparkles className="w-96 h-96 text-white" />
          </div>

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-purple-200">
              <Bot className="w-3.5 h-3.5 text-yellow-300" />
              <span>Grounded Generative AI Features</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Real Multi-Modal AI Experience
            </h2>

            <p className="text-sm sm:text-base text-purple-200/90 leading-relaxed">
              ShopSmart AI integrates Google's latest Gemini 3.8 Flash LLM and Scikit-Learn TF-IDF vectorizers directly into our FastAPI backend. Explore visual image recognition, natural language query understanding, and automated side-by-side spec comparisons.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <Link
                to="/visual-search"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/10 transition group"
              >
                <Camera className="w-6 h-6 text-purple-300 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-sm text-white">Visual Image Search</h4>
                <p className="text-xs text-purple-200/80 mt-1">Upload photos to find matching catalog products instantly</p>
              </Link>

              <Link
                to="/compare"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/10 transition group"
              >
                <Layers className="w-6 h-6 text-indigo-300 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-sm text-white">Product Comparison</h4>
                <p className="text-xs text-purple-200/80 mt-1">Side-by-side spec comparison with AI buying verdict</p>
              </Link>

              <Link
                to="/recommendations"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/10 transition group"
              >
                <Zap className="w-6 h-6 text-yellow-300 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-sm text-white">Personalized Engine</h4>
                <p className="text-xs text-purple-200/80 mt-1">Content-based cosine similarity tailored to your taste</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TRENDING AI PICKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              <TrendingUp className="w-3.5 h-3.5" /> High-Demand Electronics & Gear
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Trending Across The Store</h2>
          </div>
          <Link
            to="/recommendations"
            className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            <span>View Recommendations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <CardGridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {trendingProducts.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
