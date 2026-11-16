import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      error('Please fill in both email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      success('Welcome back to ShopSmart AI!');
      navigate(from, { replace: true });
    } catch (err: any) {
      error(err?.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl shadow-purple-500/5">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-purple-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in to ShopSmart AI</h2>
          <p className="text-xs text-slate-500">Access personalized recommendations, orders & AI features</p>
        </div>

        {/* Quick Demo Credentials Box for College Faculty Demonstration */}
        <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-3.5 space-y-2">
          <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider block">
            Academic Demo One-Click Fill:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo('demo@shopsmart.ai', 'Demo@123')}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white text-purple-700 hover:bg-purple-100/50 border border-purple-200 rounded-xl text-xs font-semibold transition"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Customer Demo</span>
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('admin@shopsmart.ai', 'Admin@123')}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Demo</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-500/20 active:scale-98 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-purple-600 hover:text-purple-700">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
};
