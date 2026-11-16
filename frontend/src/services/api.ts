import axios from 'axios';
import {
  User, Category, Product, Cart, Wishlist, Order, Review,
  ReviewSummary, Coupon, SmartSearchResponse, ChatResponse,
  VisualSearchResponse, CompareResponse,
  PriceComparisonResponse, ComparableProductSummary, PriceHistoryResponse,
  PriceAlert, PriceAlertNotification
} from '../types';

const API_BASE = '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await apiClient.post<{ access_token: string; user: User }>('/auth/login', { email, password });
    return res.data;
  },
  register: async (email: string, password: string, full_name: string, role = 'customer') => {
    const res = await apiClient.post<{ access_token: string; user: User }>('/auth/register', {
      email,
      password,
      full_name,
      role,
    });
    return res.data;
  },
  getProfile: async () => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },

  // Categories
  getCategories: async () => {
    const res = await apiClient.get<Category[]>('/categories');
    return res.data;
  },

  // Products
  getProducts: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    category?: string;
    brand?: string;
    min_price?: number;
    max_price?: number;
    min_rating?: number;
    sort_by?: string;
  }) => {
    const res = await apiClient.get<{ total: number; page: number; page_size: number; items: Product[] }>('/products', { params });
    return res.data;
  },
  getFeaturedProducts: async (limit = 8) => {
    const res = await apiClient.get<Product[]>('/products/featured', { params: { limit } });
    return res.data;
  },
  getProduct: async (idOrSlug: string | number) => {
    const res = await apiClient.get<Product>(`/products/${idOrSlug}`);
    return res.data;
  },
  getSimilarProducts: async (id: number, limit = 4) => {
    const res = await apiClient.get<Product[]>(`/products/${id}/similar`, { params: { limit } });
    return res.data;
  },
  getBrands: async () => {
    const res = await apiClient.get<string[]>('/products/brands');
    return res.data;
  },

  // Cart
  getCart: async () => {
    const res = await apiClient.get<Cart>('/cart');
    return res.data;
  },
  addToCart: async (productId: number, quantity = 1) => {
    const res = await apiClient.post<Cart>('/cart/items', { product_id: productId, quantity });
    return res.data;
  },
  updateCartItem: async (itemId: number, quantity: number) => {
    const res = await apiClient.put<Cart>(`/cart/items/${itemId}`, { quantity });
    return res.data;
  },
  removeFromCart: async (itemId: number) => {
    const res = await apiClient.delete<Cart>(`/cart/items/${itemId}`);
    return res.data;
  },
  clearCart: async () => {
    await apiClient.delete('/cart/clear');
  },

  // Wishlist
  getWishlist: async () => {
    const res = await apiClient.get<Wishlist>('/wishlist');
    return res.data;
  },
  addToWishlist: async (productId: number) => {
    const res = await apiClient.post<Wishlist>('/wishlist/items', { product_id: productId });
    return res.data;
  },
  removeFromWishlist: async (productId: number) => {
    const res = await apiClient.delete<Wishlist>(`/wishlist/items/${productId}`);
    return res.data;
  },

  // Orders & Checkout
  checkout: async (data: {
    shipping_address: string;
    shipping_city: string;
    shipping_postal_code: string;
    shipping_country?: string;
    coupon_code?: string;
    payment_method?: string;
    simulate_failure?: boolean;
  }) => {
    const res = await apiClient.post<Order>('/orders/checkout', data);
    return res.data;
  },
  getMyOrders: async () => {
    const res = await apiClient.get<Order[]>('/orders');
    return res.data;
  },
  getOrder: async (orderNumber: string) => {
    const res = await apiClient.get<Order>(`/orders/${orderNumber}`);
    return res.data;
  },

  // Coupons
  applyCoupon: async (code: string, order_amount: number) => {
    const res = await apiClient.post<{ valid: boolean; code: string; discount_percentage: number; discount_amount: number; message: string }>('/coupons/apply', { code, order_amount });
    return res.data;
  },
  getCoupons: async () => {
    const res = await apiClient.get<Coupon[]>('/coupons');
    return res.data;
  },

  // Reviews
  getReviews: async (productId: number) => {
    const res = await apiClient.get<Review[]>(`/reviews/${productId}`);
    return res.data;
  },
  addReview: async (productId: number, rating: number, comment: string, title?: string) => {
    const res = await apiClient.post<Review>('/reviews', { product_id: productId, rating, comment, title });
    return res.data;
  },
  getReviewSummary: async (productId: number) => {
    const res = await apiClient.get<ReviewSummary>(`/reviews/${productId}/summary`);
    return res.data;
  },

  // AI Modules
  smartSearch: async (query: string) => {
    const res = await apiClient.post<SmartSearchResponse>('/ai/smart-search', { query });
    return res.data;
  },
  chatAssistant: async (message: string, history: { role: string; content: string }[] = [], currentProductId?: number) => {
    const res = await apiClient.post<ChatResponse>('/ai/chat', {
      message,
      history,
      current_product_id: currentProductId,
    });
    return res.data;
  },
  visualSearch: async (data: { image_base64?: string; image_url?: string; description_hint?: string }) => {
    const res = await apiClient.post<VisualSearchResponse>('/ai/visual-search', data);
    return res.data;
  },
  compareProducts: async (productIds: number[]) => {
    const res = await apiClient.post<CompareResponse>('/ai/compare', { product_ids: productIds });
    return res.data;
  },
  getRecommendations: async (strategy: 'personalized' | 'trending' | 'content_based' = 'personalized', productId?: number) => {
    const res = await apiClient.get<{ strategy: string; recommendations: Product[] }>('/ai/recommendations', {
      params: { strategy, product_id: productId },
    });
    return res.data;
  },

  // Admin
  getAdminStats: async () => {
    const res = await apiClient.get<any>('/admin/stats');
    return res.data;
  },
  getAdminProducts: async () => {
    const res = await apiClient.get<Product[]>('/admin/products');
    return res.data;
  },
  createProduct: async (productData: any) => {
    const res = await apiClient.post<Product>('/admin/products', productData);
    return res.data;
  },
  updateProduct: async (id: number, productData: any) => {
    const res = await apiClient.put<Product>(`/admin/products/${id}`, productData);
    return res.data;
  },
  deleteProduct: async (id: number) => {
    await apiClient.delete(`/admin/products/${id}`);
  },
  getAdminOrders: async () => {
    const res = await apiClient.get<Order[]>('/admin/orders');
    return res.data;
  },
  updateOrderStatus: async (orderId: number, status: string) => {
    const res = await apiClient.put<Order>(`/admin/orders/${orderId}/status`, { status });
    return res.data;
  },
  getAdminUsers: async () => {
    const res = await apiClient.get<User[]>('/admin/users');
    return res.data;
  },

  // Snap2Price: Multi-Platform Price Comparison, Price History & Drop Alerts
  getComparableProducts: async (params?: { q?: string; category?: string; limit?: number }) => {
    const res = await apiClient.get<{ total: number; items: ComparableProductSummary[]; adapter_statuses: any[] }>('/snap2price/products', { params });
    return res.data;
  },
  compareRetailerPrices: async (params: { product_id?: number; q?: string; brand?: string; model?: string }) => {
    const res = await apiClient.get<PriceComparisonResponse>('/snap2price/compare', { params });
    return res.data;
  },
  getPriceHistory: async (productId: number) => {
    const res = await apiClient.get<PriceHistoryResponse>(`/snap2price/price-history/${productId}`);
    return res.data;
  },
  recordPriceObservation: async (
    productId: number,
    data: { retailer_name: string; price: number; original_price?: number; is_simulated?: boolean }
  ) => {
    const res = await apiClient.post<any>(`/snap2price/price-history/${productId}/record`, data);
    return res.data;
  },
  getPriceAlerts: async () => {
    const res = await apiClient.get<PriceAlert[]>('/snap2price/alerts');
    return res.data;
  },
  createPriceAlert: async (data: {
    product_id: number;
    target_price: number;
    notification_channel?: 'email' | 'aws_sns' | 'in_app';
    notification_target?: string;
  }) => {
    const res = await apiClient.post<PriceAlert>('/snap2price/alerts', data);
    return res.data;
  },
  updatePriceAlert: async (
    alertId: number,
    data: { target_price?: number; is_active?: boolean; notification_channel?: string; notification_target?: string }
  ) => {
    const res = await apiClient.patch<PriceAlert>(`/snap2price/alerts/${alertId}`, data);
    return res.data;
  },
  deletePriceAlert: async (alertId: number) => {
    const res = await apiClient.delete<{ deleted: boolean; alert_id: number }>(`/snap2price/alerts/${alertId}`);
    return res.data;
  },
  checkPriceAlertsNow: async (simulateDropAlertId?: number) => {
    const res = await apiClient.post<any>('/snap2price/alerts/check-now', null, {
      params: simulateDropAlertId ? { simulate_drop_alert_id: simulateDropAlertId } : undefined,
    });
    return res.data;
  },
  getAlertNotifications: async () => {
    const res = await apiClient.get<PriceAlertNotification[]>('/snap2price/notifications');
    return res.data;
  },
};
