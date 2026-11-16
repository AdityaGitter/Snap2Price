import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, BellRing, Plus, Trash2, Play, Pause, RefreshCw,
  CheckCircle2, Mail, MessageSquare, Sparkles, ExternalLink,
  LineChart, Zap, Lock
} from 'lucide-react';
import { api } from '../services/api';
import { ComparableProductSummary, PriceAlert, PriceAlertNotification } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const PriceAlertsPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { success, error } = useToast();

  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [notifications, setNotifications] = useState<PriceAlertNotification[]>([]);
  const [products, setProducts] = useState<ComparableProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingNow, setCheckingNow] = useState(false);

  // New Alert Form State
  const [selectedProductId, setSelectedProductId] = useState<number>(1);
  const [targetPrice, setTargetPrice] = useState('');
  const [channel, setChannel] = useState<'email' | 'aws_sns' | 'in_app'>('email');
  const [contactTarget, setContactTarget] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setContactTarget(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [alertsRes, notifsRes, prodsRes] = await Promise.all([
        api.getPriceAlerts(),
        api.getAlertNotifications(),
        api.getComparableProducts({ limit: 30 }),
      ]);
      setAlerts(alertsRes);
      setNotifications(notifsRes);
      setProducts(prodsRes.items);
      if (prodsRes.items.length > 0 && !targetPrice) {
        setSelectedProductId(prodsRes.items[0].id);
        setTargetPrice(String(Math.round(prodsRes.items[0].lowest_retailer_price * 0.9)));
      }
    } catch (err) {
      error('Failed to load price alerts dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (id: number) => {
    setSelectedProductId(id);
    const found = products.find((p) => p.id === id);
    if (found) {
      setTargetPrice(String(Math.round(found.lowest_retailer_price * 0.9)));
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericTarget = Number(targetPrice);
    if (!numericTarget || numericTarget <= 0) {
      error('Please enter a valid target price in INR.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await api.createPriceAlert({
        product_id: selectedProductId,
        target_price: numericTarget,
        notification_channel: channel,
        notification_target: contactTarget || user?.email,
      });
      success(
        created.status === 'triggered'
          ? `Price already meets ₹${numericTarget.toLocaleString('en-IN')}! Alert triggered.`
          : `Alert created! Tracking price drops to ₹${numericTarget.toLocaleString('en-IN')}.`
      );
      loadData();
    } catch (err: any) {
      error(err?.response?.data?.detail || 'Could not create price alert.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAlert = async (alert: PriceAlert) => {
    try {
      await api.updatePriceAlert(alert.id, { is_active: !alert.is_active });
      success(alert.is_active ? 'Price alert paused.' : 'Price alert resumed.');
      loadData();
    } catch (err) {
      error('Failed to update alert status.');
    }
  };

  const handleDeleteAlert = async (id: number) => {
    try {
      await api.deletePriceAlert(id);
      success('Price alert removed.');
      loadData();
    } catch (err) {
      error('Failed to remove alert.');
    }
  };

  const handleRunPriceCheck = async (simulateAlertId?: number) => {
    setCheckingNow(true);
    try {
      const res = await api.checkPriceAlertsNow(simulateAlertId);
      if (res.mode === 'simulated_price_drop_demo') {
        success(
          `Simulated drop to ₹${res.simulated_new_price.toLocaleString('en-IN')}! Alert triggered (${res.delivery_status}).`
        );
      } else {
        success(
          `Checked ${res.checked_alerts} active alert(s). Triggered ${res.triggered_count} notification(s).`
        );
      }
      loadData();
    } catch (err) {
      error('Price check job failed.');
    } finally {
      setCheckingNow(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Sign In for Automated Price Drop Alerts</h1>
        <p className="text-sm text-slate-600">
          Set custom target prices on products across Amazon, Flipkart, Croma, and Reliance Digital and receive Email or AWS SNS notifications when prices fall.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/login"
            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-md transition"
          >
            Sign In / Use Demo Account
          </Link>
          <Link
            to="/price-comparison"
            className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50"
          >
            Compare Prices First
          </Link>
        </div>
      </div>
    );
  }

  const selectedProductObj = products.find((p) => p.id === selectedProductId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold">
            <BellRing className="w-3.5 h-3.5" />
            <span>Snap2Price Automated Price Watcher</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Price Drop Alerts & Notification History
          </h1>
          <p className="text-xs text-slate-500">
            Monitored automatically by the background <code className="bg-slate-100 px-1 rounded">price-worker</code> container. Configure Email SMTP or AWS SNS credentials in `.env` for live dispatch, or evaluate with simulated delivery logs.
          </p>
        </div>

        <button
          onClick={() => handleRunPriceCheck()}
          disabled={checkingNow}
          className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${checkingNow ? 'animate-spin' : ''}`} />
          <span>{checkingNow ? 'Checking All Retailers...' : 'Run Background Check Now'}</span>
        </button>
      </div>

      {/* Target Price Creation + Alerts Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Target Price Configuration Form */}
        <form
          onSubmit={handleCreateAlert}
          className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2 text-slate-900">
            <Plus className="w-5 h-5 text-purple-600" />
            <h2 className="font-extrabold text-base">Configure New Price Alert</h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductSelect(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 outline-none focus:border-purple-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Best: ₹{p.lowest_retailer_price.toLocaleString('en-IN')})
                </option>
              ))}
            </select>
            {selectedProductObj && (
              <span className="text-[11px] text-emerald-700 font-semibold block mt-1">
                Current Lowest: ₹{selectedProductObj.lowest_retailer_price.toLocaleString('en-IN')} on{' '}
                {selectedProductObj.lowest_retailer_name}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Price (₹)</label>
            <input
              type="number"
              min={100}
              step={50}
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-200"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notification Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none"
            >
              <option value="email">Email Notification (SMTP / Logged Demo)</option>
              <option value="aws_sns">AWS SNS (Topic / SMS Integration)</option>
              <option value="in_app">In-App History Only</option>
            </select>
          </div>

          {channel !== 'in_app' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {channel === 'aws_sns' ? 'Phone (+91...) or Leave Blank for Topic' : 'Recipient Email'}
              </label>
              <input
                type="text"
                value={contactTarget}
                onChange={(e) => setContactTarget(e.target.value)}
                placeholder={channel === 'aws_sns' ? '+919876543210' : 'you@example.com'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
          >
            <Bell className="w-4 h-4" />
            <span>{submitting ? 'Saving Alert...' : 'Create Price Drop Alert'}</span>
          </button>
        </form>

        {/* Right: Configured Alerts List & Alert Notification Log */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active & Triggered Alerts Cards */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <h2 className="text-base font-extrabold text-slate-900">
                Your Monitored Price Alerts ({alerts.length})
              </h2>
            </div>

            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Bell className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No Price Alerts Configured Yet</p>
                <p className="text-xs text-slate-500">
                  Use the form on the left to set your first target price threshold.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {alerts.map((alert) => (
                  <div key={alert.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={alert.product_image || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=200&q=80'}
                        alt={alert.product_name || 'Product'}
                        className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              alert.status === 'triggered'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : alert.status === 'active'
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {alert.status}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {alert.notification_channel === 'aws_sns' ? (
                              <MessageSquare className="w-3 h-3 text-amber-600" />
                            ) : (
                              <Mail className="w-3 h-3 text-blue-600" />
                            )}
                            {alert.notification_channel.toUpperCase()} ({alert.notification_status})
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900">{alert.product_name}</h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                          <span className="text-slate-600">
                            Target: <strong className="text-purple-700">₹{alert.target_price.toLocaleString('en-IN')}</strong>
                          </span>
                          {alert.latest_observed_price && (
                            <span className="text-slate-600">
                              Latest Observed:{' '}
                              <strong className="text-slate-900">
                                ₹{alert.latest_observed_price.toLocaleString('en-IN')}
                              </strong>{' '}
                              ({alert.latest_observed_retailer})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 pt-1">
                          <Link
                            to={`/price-history/${alert.product_id}`}
                            className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            <LineChart className="w-3 h-3" /> History
                          </Link>
                          <Link
                            to={`/price-comparison?productId=${alert.product_id}`}
                            className="text-[11px] font-bold text-purple-600 hover:underline flex items-center gap-1"
                          >
                            Compare Retailers
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Alert Action Controls */}
                    <div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleRunPriceCheck(alert.id)}
                        disabled={checkingNow}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold transition"
                        title="Academic Demo: simulate a price drop below target to verify alert delivery"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                        <span>Simulate Drop (Demo)</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleAlert(alert)}
                          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                          title={alert.is_active ? 'Pause alert' : 'Resume alert'}
                        >
                          {alert.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="p-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition"
                          title="Delete alert"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notification Delivery History Log */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Triggered Alert Notification History ({notifications.length})</span>
              </h3>
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No notifications dispatched yet. Click <strong>Simulate Drop (Demo)</strong> on any alert above to watch instant trigger & notification logging.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div key={n.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                          {n.delivery_status}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 uppercase">{n.channel}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(n.sent_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900">{n.message}</p>
                    </div>

                    {n.retailer_url && (
                      <a
                        href={n.retailer_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 flex-shrink-0 transition"
                      >
                        <span>Buy on {n.retailer_name}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
