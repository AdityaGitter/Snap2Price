import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Bot } from 'lucide-react';

// Context Providers
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

// Components
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AIChatDrawer } from './components/AIChatDrawer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public & Customer Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProductListingPage } from './pages/ProductListingPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { AIVisualSearchPage } from './pages/AIVisualSearchPage';
import { AIRecommendationsPage } from './pages/AIRecommendationsPage';
import { ProductComparisonPage } from './pages/ProductComparisonPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { WishlistPage } from './pages/WishlistPage';
import { ProfilePage } from './pages/ProfilePage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { PriceComparisonPage } from './pages/PriceComparisonPage';
import { PriceHistoryPage } from './pages/PriceHistoryPage';
import { PriceAlertsPage } from './pages/PriceAlertsPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';

// Helper to scroll to top on navigation
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Main App Layout
const AppContent: React.FC = () => {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-purple-600 selection:text-white">
      <ScrollToTop />
      <Navbar onOpenAIChat={() => setIsAIChatOpen(true)} />

      <main className="flex-grow">
        <Routes>
          {/* Public Storefront */}
          <Route path="/" element={<HomePage onOpenAIChat={() => setIsAIChatOpen(true)} />} />
          <Route path="/products" element={<ProductListingPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/compare" element={<ProductComparisonPage />} />

          {/* AI Features */}
          <Route path="/visual-search" element={<AIVisualSearchPage />} />
          <Route path="/recommendations" element={<AIRecommendationsPage />} />
          <Route path="/assistant" element={<AIAssistantPage />} />

          {/* Snap2Price Multi-Platform Price Comparison, History & Alerts */}
          <Route path="/price-comparison" element={<PriceComparisonPage />} />
          <Route path="/price-history/:productId" element={<PriceHistoryPage />} />
          <Route path="/price-alerts" element={<PriceAlertsPage />} />

          {/* Authenticated Customer Routes */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-confirmation/:orderNumber"
            element={
              <ProtectedRoute>
                <OrderConfirmationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute requireAdmin>
                <AdminProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute requireAdmin>
                <AdminOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute requireAdmin>
                <AdminAnalytics />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<HomePage onOpenAIChat={() => setIsAIChatOpen(true)} />} />
        </Routes>
      </main>

      {!isAdminRoute && <Footer />}

      {/* Persistent Gemini AI Floating Assistant Button */}
      {!isAIChatOpen && (
        <button
          onClick={() => setIsAIChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition duration-200 group border-2 border-white/20"
          title="Open Gemini AI Assistant"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-purple-600"></span>
          </div>
          <span className="text-sm font-semibold pr-1 hidden sm:inline-block">Ask ShopSmart AI</span>
        </button>
      )}

      {/* Slide-out Gemini AI Chat Drawer */}
      <AIChatDrawer isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AppContent />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
};

export default App;
