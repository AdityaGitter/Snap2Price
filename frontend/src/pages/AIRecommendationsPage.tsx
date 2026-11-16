import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Zap, Cpu, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { CardGridSkeleton } from '../components/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';

export const AIRecommendationsPage: React.FC = () => {
  const { user } = useAuth();
  const [strategy, setStrategy] = useState<'personalized' | 'trending' | 'content_based'>('personalized');
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecs = async (strat: 'personalized' | 'trending' | 'content_based') => {
    setLoading(true);
    try {
      const data = await api.getRecommendations(strat);
      setRecommendations(data.recommendations);
    } catch (err) {
      console.error('Failed to load recommendations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecs(strategy);
  }, [strategy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
          <Cpu className="w-3.5 h-3.5" />
          <span>Scikit-Learn Machine Learning Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          AI Recommendations Engine
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Powered by TF-IDF Vector Space modeling and Cosine Similarity matrices. Analyzes browsing history, past purchases, and cross-category affinities in real time.
        </p>
      </div>

      {/* Strategy Toggle Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setStrategy('personalized')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
              strategy === 'personalized'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personalized For You</span>
          </button>

          <button
            onClick={() => setStrategy('trending')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
              strategy === 'trending'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Trending Storewide</span>
          </button>

          <button
            onClick={() => setStrategy('content_based')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
              strategy === 'content_based'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Content Affinity</span>
          </button>
        </div>
      </div>

      {/* Explanatory Architecture Banner */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
              Active Strategy: {strategy.replace('_', ' ').toUpperCase()}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white">
              Real ML
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
            {strategy === 'personalized'
              ? user
                ? `Modeling user interactions for '${user.full_name}' across viewed products, active cart items, and completed orders.`
                : 'Guest session: Modeling popular customer patterns until you sign in to build your custom affinity vector.'
              : strategy === 'trending'
              ? 'Ranked based on verified customer ratings (4.5★+), total reviews volume, and featured status.'
              : 'Constructing high-dimensional feature vectors across product names, brands, technical specs, and descriptions.'}
          </p>
        </div>

        <button
          onClick={() => fetchRecs(strategy)}
          className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition shadow-xs flex-shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Recommendations</span>
        </button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <CardGridSkeleton count={8} />
      ) : recommendations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <p className="text-sm text-slate-500">No recommendations available at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recommendations.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};
