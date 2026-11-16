import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingDown, TrendingUp, Minus, ArrowLeft, Bell, Sparkles,
  CheckCircle2, PlusCircle, Clock, ExternalLink, Info
} from 'lucide-react';
import { api } from '../services/api';
import { PriceHistoryResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const RETAILER_COLORS: Record<string, string> = {
  'Amazon India': '#f59e0b',
  Flipkart: '#2563eb',
  Croma: '#0d9488',
  'Reliance Digital': '#e11d48',
};

export const PriceHistoryPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [historyData, setHistoryData] = useState<PriceHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Quick Price Alert form
  const [targetPrice, setTargetPrice] = useState('');
  const [channel, setChannel] = useState<'email' | 'aws_sns' | 'in_app'>('email');
  const [savingAlert, setSavingAlert] = useState(false);

  // Academic demo: Record simulated observation
  const [simPrice, setSimPrice] = useState('');
  const [simRetailer, setSimRetailer] = useState('Amazon India');
  const [recordingObs, setRecordingObs] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const { success, error } = useToast();

  useEffect(() => {
    if (productId) {
      fetchHistory(Number(productId));
    }
  }, [productId]);

  const fetchHistory = async (id: number) => {
    setLoading(true);
    try {
      const data = await api.getPriceHistory(id);
      setHistoryData(data);
      setTargetPrice(String(Math.round(data.statistics.lowest_recorded_price * 0.92)));
      setSimPrice(String(Math.round(data.statistics.latest_recorded_price * 0.95)));
    } catch (err) {
      error('Failed to load historical price trends.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyData) return;
    if (!isAuthenticated) {
      error('Please sign in first to save a price-drop alert.');
      return;
    }
    const targetVal = Number(targetPrice);
    if (!targetVal || targetVal <= 0) {
      error('Please enter a valid target price.');
      return;
    }

    setSavingAlert(true);
    try {
      const created = await api.createPriceAlert({
        product_id: historyData.product.id,
        target_price: targetVal,
        notification_channel: channel,
        notification_target: user?.email,
      });
      if (created.status === 'triggered') {
        success(`Target ₹${targetVal.toLocaleString('en-IN')} already reached! Notification triggered.`);
      } else {
        success(`Alert active! We will notify you when price drops to ₹${targetVal.toLocaleString('en-IN')}.`);
      }
    } catch (err: any) {
      error(err?.response?.data?.detail || 'Could not create alert');
    } finally {
      setSavingAlert(false);
    }
  };

  const handleRecordObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyData) return;
    const priceNum = Number(simPrice);
    if (!priceNum || priceNum <= 0) {
      error('Enter a valid price in INR.');
      return;
    }
    setRecordingObs(true);
    try {
      const res = await api.recordPriceObservation(historyData.product.id, {
        retailer_name: simRetailer,
        price: priceNum,
        is_simulated: true,
      });
      if (res.triggered_alert_ids?.length > 0) {
        success(`Recorded ₹${priceNum.toLocaleString('en-IN')} & triggered ${res.triggered_alert_ids.length} price alert(s)!`);
      } else {
        success(`Recorded simulated price observation: ₹${priceNum.toLocaleString('en-IN')} on ${simRetailer}`);
      }
      fetchHistory(historyData.product.id);
    } catch (err) {
      error('Failed to record observation.');
    } finally {
      setRecordingObs(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="h-28 bg-white rounded-3xl border border-slate-200 animate-pulse" />
        <div className="h-80 bg-white rounded-3xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (!historyData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Product Price History Unavailable</h2>
        <Link to="/price-comparison" className="text-purple-600 font-bold hover:underline">
          ← Return to Price Comparison
        </Link>
      </div>
    );
  }

  const { product, statistics, retailers, chart_data, history_records, contains_simulated_data } = historyData;

  const TrendBadge = () => {
    if (statistics.trend_direction === 'dropping') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
          <TrendingDown className="w-4 h-4" /> Dropping ({statistics.price_change_percent}%)
        </span>
      );
    }
    if (statistics.trend_direction === 'rising') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-extrabold">
          <TrendingUp className="w-4 h-4" /> Rising (+{statistics.price_change_percent}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold">
        <Minus className="w-4 h-4" /> Stable ({statistics.price_change_percent}%)
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to={`/price-comparison?productId=${product.id}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-purple-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Multi-Platform Comparison
        </Link>
        <Link
          to="/price-alerts"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition"
        >
          <Bell className="w-3.5 h-3.5" /> View My Price Alerts
        </Link>
      </div>

      {/* Product Summary Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-20 h-20 rounded-2xl object-cover bg-slate-100 border border-slate-200"
          />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                {product.brand || 'Tracked Product'}
              </span>
              <TrendBadge />
              {statistics.is_all_time_low && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase">
                  <Sparkles className="w-3 h-3" /> At Recorded Low
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{product.name}</h1>
            <p className="text-xs text-slate-600">{statistics.trend_summary}</p>
          </div>
        </div>

        <Link
          to={`/price-comparison?productId=${product.id}`}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 transition flex-shrink-0"
        >
          <span>Compare Live Deals Now</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Reference / Simulation Disclosure */}
      {contains_simulated_data && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl px-4 py-3 text-xs flex items-center gap-2.5">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>Historical Observation Notice:</strong> Tracked timestamps combine real API updates (when affiliate APIs are configured) with clearly tagged reference/simulated observations stored in PostgreSQL/SQLite <code className="bg-amber-100 px-1 rounded">price_history</code>.
          </span>
        </div>
      )}

      {/* 4 Key Price Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
            Lowest Recorded Price
          </span>
          <span className="text-2xl font-black text-slate-900 block mt-1">
            ₹{statistics.lowest_recorded_price.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-500 block mt-1">
            on <strong>{statistics.lowest_recorded_retailer}</strong>
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-rose-200 p-5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
            Highest Recorded Price
          </span>
          <span className="text-2xl font-black text-slate-900 block mt-1">
            ₹{statistics.highest_recorded_price.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-500 block mt-1">
            on <strong>{statistics.highest_recorded_retailer}</strong>
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-purple-200 p-5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 block">
            Latest Observed Price
          </span>
          <span className="text-2xl font-black text-slate-900 block mt-1">
            ₹{statistics.latest_recorded_price.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-500 block mt-1">
            Best right now on <strong>{statistics.latest_recorded_retailer}</strong>
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Historical Average Price
          </span>
          <span className="text-2xl font-black text-slate-900 block mt-1">
            ₹{statistics.average_price.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-500 block mt-1">
            Across <strong>{statistics.total_observations}</strong> logged checkpoints
          </span>
        </div>
      </div>

      {/* Main Chart + Set Price Alert Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recharts Multi-Retailer Historical Price Trend */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Multi-Retailer Price History Chart (INR ₹)
              </h2>
              <p className="text-xs text-slate-500">
                Tracks platform price movements over the recorded history window
              </p>
            </div>
          </div>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart_data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`}
                />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                  contentStyle={{
                    borderRadius: '14px',
                    borderColor: '#cbd5e1',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px rgba(15, 23, 42, 0.1)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                {retailers.map((retName) => (
                  <Line
                    key={retName}
                    type="monotone"
                    dataKey={retName}
                    stroke={RETAILER_COLORS[retName] || '#7c3aed'}
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Target Alert Form + Demo Observation Simulator */}
        <div className="lg:col-span-4 space-y-6">
          {/* Set Target Price Alert */}
          <form
            onSubmit={handleSetAlert}
            className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-3xl p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2 text-purple-900">
              <Bell className="w-5 h-5 text-purple-600" />
              <h3 className="font-extrabold text-base">Set Price Drop Alert</h3>
            </div>
            <p className="text-xs text-slate-600">
              Get notified automatically whenever any retailer drops to or below your target price.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Price (₹)</label>
              <input
                type="number"
                min={100}
                step={50}
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Notification Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-sm font-medium text-slate-800 outline-none"
              >
                <option value="email">Email Notification</option>
                <option value="aws_sns">AWS SNS (SMS / Topic)</option>
                <option value="in_app">In-App History Only</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={savingAlert}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{savingAlert ? 'Creating Alert...' : 'Track & Notify Me'}</span>
            </button>
          </form>

          {/* Academic Tool: Record Simulated Price Observation */}
          <form
            onSubmit={handleRecordObservation}
            className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3"
          >
            <div className="flex items-center gap-2 text-slate-900">
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              <h4 className="font-bold text-sm">Record Price Observation (Demo)</h4>
            </div>
            <p className="text-[11px] text-slate-500">
              Test timestamped history persistence & instant alert evaluation by logging a new retailer observation.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={simRetailer}
                onChange={(e) => setSimRetailer(e.target.value)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50"
              >
                <option value="Amazon India">Amazon India</option>
                <option value="Flipkart">Flipkart</option>
                <option value="Croma">Croma</option>
                <option value="Reliance Digital">Reliance Digital</option>
              </select>
              <input
                type="number"
                min={100}
                step={50}
                value={simPrice}
                onChange={(e) => setSimPrice(e.target.value)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                required
              />
            </div>

            <button
              type="submit"
              disabled={recordingObs}
              className="w-full py-2 rounded-xl bg-slate-900 hover:bg-indigo-700 text-white text-xs font-bold transition"
            >
              {recordingObs ? 'Recording...' : 'Save Observation to Database'}
            </button>
          </form>
        </div>
      </div>

      {/* Historical Observations Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span>Timestamped Price Observations Log</span>
          </h3>
          <span className="text-xs text-slate-500">Showing latest {history_records.length} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Retailer</th>
                <th className="px-6 py-3">Observed Price</th>
                <th className="px-6 py-3">MRP</th>
                <th className="px-6 py-3">Source Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history_records.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/80">
                  <td className="px-6 py-3 text-slate-600 font-medium">
                    {new Date(rec.recorded_at).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="px-6 py-3 font-bold text-slate-900">{rec.retailer_name}</td>
                  <td className="px-6 py-3 font-extrabold text-purple-700">
                    ₹{rec.price.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-3 text-slate-400">
                    {rec.original_price ? `₹${rec.original_price.toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rec.is_simulated
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {rec.is_simulated ? 'Simulated / Reference' : 'Live API Observation'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
