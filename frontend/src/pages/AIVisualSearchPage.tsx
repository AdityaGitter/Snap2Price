import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera, Upload, Sparkles, Image as ImageIcon, ArrowRight,
  CheckCircle2, RefreshCw, Zap, ExternalLink, Info, TrendingDown, LineChart
} from 'lucide-react';
import { api } from '../services/api';
import { VisualSearchResponse, Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { useToast } from '../context/ToastContext';

export const AIVisualSearchPage: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [descriptionHint, setDescriptionHint] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<VisualSearchResponse | null>(null);
  const { error } = useToast();

  // Sample one-click images for live faculty demonstration
  const sampleImages = [
    {
      title: 'Studio Headphones',
      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
      hint: 'Over-ear wireless noise canceling headphones with matte black finish',
    },
    {
      title: 'Ultralight Laptop',
      url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
      hint: 'Slim metallic laptop with narrow bezel display',
    },
    {
      title: 'Running Sneakers',
      url: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=500&q=80',
      hint: 'Athletic leather high-top retro basketball sneakers',
    },
    {
      title: 'Fitness Smartwatch',
      url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&q=80',
      hint: 'Modern dark sports smartwatch with digital touch display',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        error('Please select an image smaller than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setDescriptionHint(file.name.replace(/\.[^/.]+$/, ''));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePickSample = (sample: typeof sampleImages[0]) => {
    setSelectedImage(sample.url);
    setDescriptionHint(sample.hint);
  };

  const handleSearch = async () => {
    if (!selectedImage && !descriptionHint) {
      error('Please upload an image or select a sample image first.');
      return;
    }

    setSearching(true);
    setResult(null);

    try {
      const isDataUrl = selectedImage?.startsWith('data:');
      const response = await api.visualSearch({
        image_base64: isDataUrl ? selectedImage : undefined,
        image_url: !isDataUrl ? selectedImage || undefined : undefined,
        description_hint: descriptionHint || undefined,
      });

      setResult(response);
    } catch (err) {
      console.error('Visual search failed', err);
      error('Failed to perform visual search. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
          <Camera className="w-3.5 h-3.5" />
          <span>Multimodal Vision Feature</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          AI Visual Product Search
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Upload any photo of an item you love. Google Gemini analyses visual characteristics—shape, category, color palette, and textures—to locate closest catalog matches.
        </p>
      </div>

      {/* Upload & Sample Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Upload Container */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-2 border-dashed border-purple-200 hover:border-purple-400 rounded-2xl p-6 text-center transition bg-purple-50/20 relative group">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-800 block">
                  Drag and drop your photo here or <span className="text-purple-600 underline">browse</span>
                </span>
                <span className="text-xs text-slate-400 mt-1 block">Supports PNG, JPG, WebP up to 5MB</span>
              </div>
            </div>
          </div>

          {/* Image Preview and Controls */}
          {selectedImage && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-white border border-slate-200 flex-shrink-0 relative">
                <img src={selectedImage} alt="Uploaded preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 w-full space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Selected Visual Target
                </span>
                <input
                  type="text"
                  value={descriptionHint}
                  onChange={(e) => setDescriptionHint(e.target.value)}
                  placeholder="Optional hint: e.g. 'black over-ear headphones'..."
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white outline-none"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleSearch}
            disabled={(!selectedImage && !descriptionHint) || searching}
            className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold text-sm shadow-md shadow-purple-500/20 active:scale-98 transition flex items-center justify-center gap-2"
          >
            {searching ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Gemini Analyzing Visual Signatures...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Search Catalog by Image</span>
              </>
            )}
          </button>
        </div>

        {/* Demo Preset Gallery for Evaluators */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Demo Preset Gallery (1-Click Test)
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Click any demo image below to test visual feature matching instantly during presentation:
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {sampleImages.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePickSample(s)}
                className={`group p-2 rounded-2xl border text-left transition flex flex-col gap-2 ${
                  selectedImage === s.url
                    ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-100'
                    : 'border-slate-200 hover:border-purple-300 bg-white'
                }`}
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 w-full">
                  <img src={s.url} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-800 block truncate">{s.title}</span>
                  <span className="text-[10px] text-purple-600 font-semibold">Click to select</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Search Results Section */}
      {result && (
        <div className="space-y-8 pt-6 border-t border-slate-200 animate-in fade-in">
          {/* Honest Method Disclosure & Extracted Product Identification Card */}
          <div
            className={`rounded-3xl p-6 shadow-sm border space-y-4 ${
              result.ai_vision_used
                ? 'bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-purple-200'
                : 'bg-amber-50/70 border-amber-200'
            }`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full text-white ${
                      result.ai_vision_used ? 'bg-purple-600' : 'bg-amber-600'
                    }`}
                  >
                    {result.ai_vision_used
                      ? 'Google Gemini Multimodal Vision'
                      : 'Metadata Similarity Fallback (No Image Vision Executed)'}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    Confidence: {Math.round(result.confidence_score * 100)}% Match
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-slate-900">
                  Identified: {result.identified_product?.product_name || result.matched_category || 'Matched Product'}
                </h3>

                {result.method_explanation && (
                  <p className="text-xs text-slate-700 flex items-start gap-1.5 pt-0.5">
                    <Info className="w-4 h-4 flex-shrink-0 text-slate-500 mt-0.5" />
                    <span>{result.method_explanation}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-white/90 px-4 py-2 rounded-2xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Catalog Hits</span>
                  <span className="text-lg font-black text-purple-700">{result.matched_products.length} Items</span>
                </div>
              </div>
            </div>

            {/* Structured Identification Metadata: Category, Brand, Model, Visual Attributes & Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="bg-white/90 rounded-2xl p-3 border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Category</span>
                <span className="text-xs font-extrabold text-slate-900">
                  {result.identified_product?.category || result.matched_category || 'Electronics'}
                </span>
              </div>
              <div className="bg-white/90 rounded-2xl p-3 border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Brand</span>
                <span className="text-xs font-extrabold text-slate-900">
                  {result.identified_product?.brand || 'Not specified'}
                </span>
              </div>
              <div className="bg-white/90 rounded-2xl p-3 border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Model</span>
                <span className="text-xs font-extrabold text-slate-900">
                  {result.identified_product?.model || 'General match'}
                </span>
              </div>
              <div className="bg-white/90 rounded-2xl p-3 border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Visual Attributes</span>
                <span className="text-xs font-medium text-slate-700 line-clamp-2">
                  {(result.identified_product?.visual_attributes || []).join(', ') || 'Matched via catalog attributes'}
                </span>
              </div>
            </div>

            {result.identified_product?.specifications &&
              Object.keys(result.identified_product.specifications).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Object.entries(result.identified_product.specifications).map(([k, v]) => (
                    <span
                      key={k}
                      className="text-[11px] bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700"
                    >
                      <strong className="text-slate-900">{k}:</strong> {String(v)}
                    </span>
                  ))}
                </div>
              )}
          </div>

          {/* Snap2Price Multi-Platform Comparison Connected Directly from Visual Identification */}
          {result.retailer_comparison && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> Snap2Price Multi-Retailer Match
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                    Compare Prices for {result.retailer_comparison.product.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {result.retailer_comparison.data_disclaimer}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/price-comparison?productId=${result.retailer_comparison.product.id}`}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <span>Full Comparison</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to={`/price-history/${result.retailer_comparison.product.id}`}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <LineChart className="w-3.5 h-3.5 text-purple-300" />
                    <span>Price History</span>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {result.retailer_comparison.retailer_offers.map((offer, idx) => (
                  <div
                    key={offer.id}
                    className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 ${
                      idx === 0
                        ? 'border-emerald-400 bg-emerald-50/40 ring-1 ring-emerald-200'
                        : 'border-slate-200 bg-slate-50/40'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900">{offer.retailer_name}</span>
                        {idx === 0 && (
                          <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                            BEST DEAL
                          </span>
                        )}
                      </div>
                      <span className="text-xl font-black text-slate-900 block">
                        ₹{offer.current_price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {offer.delivery_charge === 0 ? 'Free Delivery' : `+₹${offer.delivery_charge} shipping`}
                      </span>
                      <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded inline-block">
                        {offer.is_simulated ? 'Reference Mock Data' : 'Live Retailer API'}
                      </span>
                    </div>

                    <a
                      href={offer.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        idx === 0
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-white border border-slate-300 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <span>Open on {offer.retailer_name}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched Products Grid */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Matching Products in ShopSmart Catalog
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {result.matched_products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
