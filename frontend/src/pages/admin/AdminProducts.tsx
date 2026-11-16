import React, { useState, useEffect } from 'react';
import {
  Package, Plus, Search, Edit2, Trash2, X, Check,
  AlertTriangle, Sparkles, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Product, Category } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [categoryId, setCategoryId] = useState('1');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [features, setFeatures] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  const { success, error } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        api.getAdminProducts(),
        api.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setOriginalPrice('');
    setStock('15');
    setCategoryId(categories[0]?.id.toString() || '1');
    setBrand('');
    setDescription('');
    setImageUrl('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80');
    setFeatures('High performance\nPremium build quality\nEnergy efficient');
    setIsFeatured(false);
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setPrice(p.price.toString());
    setOriginalPrice(p.original_price?.toString() || '');
    setStock(p.stock.toString());
    setCategoryId(p.category_id.toString());
    setBrand(p.brand || '');
    setDescription(p.description);
    setImageUrl(p.image_url);
    setFeatures(p.features || '');
    setIsFeatured(p.is_featured);
    setModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !description || !imageUrl) {
      error('Please complete required product fields');
      return;
    }

    const payload = {
      name,
      description,
      price: parseFloat(price),
      original_price: originalPrice ? parseFloat(originalPrice) : undefined,
      stock: parseInt(stock, 10),
      category_id: parseInt(categoryId, 10),
      brand: brand || undefined,
      image_url: imageUrl,
      features,
      is_featured: isFeatured,
    };

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        success(`Updated "${name}" successfully!`);
      } else {
        await api.createProduct(payload);
        success(`Created "${name}" and refreshed AI recommender!`);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      error('Failed to save product');
    }
  };

  const handleDelete = async (id: number, prodName: string) => {
    if (confirm(`Are you sure you want to delete "${prodName}"?`)) {
      try {
        await api.deleteProduct(id);
        success(`Deleted "${prodName}"`);
        loadData();
      } catch (err) {
        error('Failed to delete product');
      }
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/admin" className="text-slate-400 hover:text-slate-600">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Product Catalog Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Manage inventory, prices, images, and AI feature embeddings</p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter products by title, category, or brand..."
          className="w-full text-xs text-slate-800 outline-none bg-transparent"
        />
        <span className="text-xs text-slate-400 whitespace-nowrap">{filtered.length} products</span>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price (₹)</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-10 h-10 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block truncate max-w-xs">{p.name}</span>
                        <span className="text-[10px] text-slate-400">{p.brand || 'Generic'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-600">{p.category?.name || 'General'}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">₹{p.price.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.stock > 10
                          ? 'bg-emerald-50 text-emerald-700'
                          : p.stock > 0
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {p.stock} units
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">★ {p.rating.toFixed(1)}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add / Edit Product */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingProduct ? 'Edit Catalog Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="Optional for discount"
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Stock</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-600 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Brand</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Sony"
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Image URL</label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Comprehensive description for content similarity scoring..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Features (Newline separated)</label>
                <textarea
                  rows={2}
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="Feature 1&#10;Feature 2"
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="featured"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="featured" className="font-semibold text-slate-800 cursor-pointer">
                  Feature this item on homepage highlights
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md shadow-purple-500/20 transition"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
