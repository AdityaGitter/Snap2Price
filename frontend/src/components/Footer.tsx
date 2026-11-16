import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Shield, Cpu, Cloud, Code, Heart, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800 mt-24">
      {/* Upper features ribbon */}
      <div className="border-b border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Google Gemini AI</h4>
              <p className="text-xs text-slate-500">Conversational Shopping Concierge & Vision</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Scikit-Learn Recommendations</h4>
              <p className="text-xs text-slate-500">TF-IDF Vector Space & Cosine Similarity</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Docker & Cloud Automation</h4>
              <p className="text-xs text-slate-500">Containerized microservices & AWS Terraform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Secure Authentication</h4>
              <p className="text-xs text-slate-500">JWT Token Security & Bcrypt hashing</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-lg font-extrabold text-white">ShopSmart <span className="text-purple-400">AI</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              An intelligent, production-ready e-commerce platform developed as a Final-Year Computer Science & DevOps Capstone Project. Incorporates cutting-edge LLMs, machine learning content filtering, and cloud automation.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Code className="w-4 h-4 text-purple-400" />
              <span>React 18 • TypeScript • FastAPI • PostgreSQL • Docker</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">AI & Snap2Price</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/price-comparison" className="hover:text-emerald-400 transition font-medium text-emerald-300">Multi-Platform Price Compare</Link></li>
              <li><Link to="/price-history/1" className="hover:text-purple-400 transition">Price History Tracker</Link></li>
              <li><Link to="/price-alerts" className="hover:text-purple-400 transition">Price Drop Alerts</Link></li>
              <li><Link to="/visual-search" className="hover:text-purple-400 transition">Visual Image Search</Link></li>
              <li><Link to="/assistant" className="hover:text-purple-400 transition">Shopping Assistant (Gemini)</Link></li>
              <li><Link to="/recommendations" className="hover:text-purple-400 transition">Personalized Recs</Link></li>
              <li><Link to="/compare" className="hover:text-purple-400 transition">Product Comparison</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">Categories</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/products?category=laptops-computing" className="hover:text-purple-400 transition">Laptops & Computing</Link></li>
              <li><Link to="/products?category=smartphones-audio" className="hover:text-purple-400 transition">Smartphones & Audio</Link></li>
              <li><Link to="/products?category=electronics" className="hover:text-purple-400 transition">Electronics & Cameras</Link></li>
              <li><Link to="/products?category=fashion-apparel" className="hover:text-purple-400 transition">Fashion & Apparel</Link></li>
              <li><Link to="/products?category=home-kitchen" className="hover:text-purple-400 transition">Home & Kitchen</Link></li>
              <li><Link to="/products?category=fitness-lifestyle" className="hover:text-purple-400 transition">Fitness & Lifestyle</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">College Demo Links</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/admin" className="hover:text-purple-400 transition flex items-center gap-1">Admin Portal <ArrowUpRight className="w-3 h-3 text-purple-400" /></Link></li>
              <li><a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-purple-400 transition flex items-center gap-1">FastAPI Swagger Docs <ArrowUpRight className="w-3 h-3 text-purple-400" /></a></li>
              <li><Link to="/orders" className="hover:text-purple-400 transition">Order Tracking</Link></li>
              <li><Link to="/cart" className="hover:text-purple-400 transition">Cart & Checkout</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 ShopSmart AI Platform. Designed for Academic Demonstration.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> by Final-Year Student
          </p>
        </div>
      </div>
    </footer>
  );
};
