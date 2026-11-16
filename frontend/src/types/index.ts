export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'customer' | 'admin';
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  product_count?: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price?: number;
  stock: number;
  category_id: number;
  brand?: string;
  rating: number;
  review_count: number;
  image_url: string;
  images?: string;
  features?: string;
  specifications?: string;
  is_featured: boolean;
  created_at: string;
  category?: Category;
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
  subtotal: number;
  total_items: number;
}

export interface WishlistItem {
  id: number;
  product_id: number;
  product: Product;
}

export interface Wishlist {
  id: number;
  user_id: number;
  items: WishlistItem[];
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_price: number;
  product_image?: string;
  quantity: number;
  subtotal: number;
}

export interface Payment {
  id: number;
  payment_method: string;
  transaction_id: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  coupon_code?: string;
  created_at: string;
  items: OrderItem[];
  payment?: Payment;
}

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  user_name?: string;
  rating: number;
  title?: string;
  comment: string;
  verified_purchase: number;
  sentiment?: string;
  created_at: string;
}

export interface ReviewSummary {
  product_id: number;
  average_rating: number;
  total_reviews: number;
  sentiment_breakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  ai_summary?: string;
  key_pros: string[];
  key_cons: string[];
}

export interface Coupon {
  id: number;
  code: string;
  discount_percentage: number;
  max_discount_amount?: number;
  min_order_amount: number;
  is_active: boolean;
}

export interface SmartSearchResponse {
  query: string;
  interpreted_filters: {
    category?: string;
    brand?: string;
    min_price?: number;
    max_price?: number;
    min_rating?: number;
    keywords: string[];
    sort_by: string;
  };
  ai_explanation: string;
  results: Product[];
  total: number;
}

export interface ChatResponse {
  reply: string;
  suggested_products: Product[];
  quick_actions: string[];
}

export interface VisualSearchResponse {
  detected_attributes: Record<string, any>;
  matched_category?: string;
  identified_product?: {
    category?: string;
    brand?: string;
    model?: string;
    product_name?: string;
    visual_attributes?: string[];
    specifications?: Record<string, any>;
  };
  confidence_score: number;
  matched_products: Product[];
  search_method: string;
  ai_vision_used?: boolean;
  method_explanation?: string;
  retailer_comparison?: PriceComparisonResponse;
}

export interface CompareResponse {
  products: Product[];
  ai_comparison_verdict: string;
  best_value_winner?: string;
  best_performance_winner?: string;
  comparison_matrix: Record<string, any>[];
}

// Snap2Price Multi-Platform Comparison, History & Alerts Types
export interface RetailerOffer {
  id: number;
  product_id: number;
  retailer_name: string;
  retailer_slug: string;
  brand?: string;
  model_number: string;
  product_name: string;
  image_url: string;
  current_price: number;
  original_price?: number;
  discount_percentage: number;
  delivery_charge: number;
  delivery_estimate?: string;
  total_landed_price: number;
  rating?: number;
  review_count: number;
  product_url: string;
  url_verified: boolean;
  url_verification_note: string;
  in_stock: boolean;
  data_source: string;
  is_simulated: boolean;
  data_source_label: string;
  last_updated?: string;
}

export interface LowestPriceRecommendation {
  retailer_name: string;
  retailer_slug: string;
  best_price: number;
  delivery_charge: number;
  total_landed_price: number;
  savings_vs_highest_retailer: number;
  savings_vs_mrp: number;
  product_url: string;
  url_verified: boolean;
  is_simulated: boolean;
  recommendation_reason: string;
}

export interface PriceComparisonResponse {
  product: {
    id: number;
    name: string;
    slug: string;
    brand?: string;
    model_number: string;
    category: string;
    image_url: string;
    rating: number;
    review_count: number;
    specifications: Record<string, any>;
    internal_demo_price: number;
  };
  exact_model_matched: boolean;
  canonical_model_number: string;
  data_disclaimer: string;
  contains_simulated_data: boolean;
  retailer_offers: RetailerOffer[];
  lowest_price_recommendation?: LowestPriceRecommendation;
  adapter_statuses: {
    retailer_name: string;
    retailer_slug: string;
    live_api_configured: boolean;
    data_source: string;
    source_label: string;
  }[];
}

export interface ComparableProductSummary {
  id: number;
  name: string;
  slug: string;
  brand?: string;
  model_number: string;
  category: string;
  image_url: string;
  rating: number;
  review_count: number;
  lowest_retailer_price: number;
  lowest_retailer_name: string;
  highest_retailer_price: number;
  max_savings: number;
  retailer_count: number;
  contains_simulated_data: boolean;
}

export interface PriceHistoryResponse {
  product: {
    id: number;
    name: string;
    slug: string;
    brand?: string;
    image_url: string;
    current_best_price: number;
    best_retailer: string;
  };
  statistics: {
    lowest_recorded_price: number;
    lowest_recorded_retailer: string;
    lowest_recorded_at?: string;
    highest_recorded_price: number;
    highest_recorded_retailer: string;
    highest_recorded_at?: string;
    latest_recorded_price: number;
    latest_recorded_retailer: string;
    average_price: number;
    total_observations: number;
    trend_direction: 'dropping' | 'rising' | 'stable';
    price_change_percent: number;
    trend_summary: string;
    is_all_time_low: boolean;
  };
  retailers: string[];
  chart_data: Record<string, any>[];
  history_records: {
    id: number;
    retailer_name: string;
    price: number;
    original_price?: number;
    currency: string;
    is_simulated: boolean;
    recorded_at: string;
  }[];
  contains_simulated_data: boolean;
}

export interface PriceAlertNotification {
  id: number;
  alert_id: number;
  product_id: number;
  product_name?: string;
  retailer_name: string;
  observed_price: number;
  target_price: number;
  channel: string;
  delivery_status: string;
  message: string;
  retailer_url?: string;
  sent_at: string;
}

export interface PriceAlert {
  id: number;
  user_id: number;
  product_id: number;
  product_name?: string;
  product_image?: string;
  target_price: number;
  initial_observed_price?: number;
  latest_observed_price?: number;
  latest_observed_retailer?: string;
  notification_channel: 'email' | 'aws_sns' | 'in_app';
  notification_target?: string;
  status: 'active' | 'triggered' | 'paused';
  notification_status: string;
  is_active: boolean;
  last_checked_at?: string;
  triggered_at?: string;
  created_at: string;
  notifications: PriceAlertNotification[];
}
