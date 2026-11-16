# ShopSmart AI – REST API Specification & Endpoint Reference

The ShopSmart AI backend exposes a high-performance RESTful API constructed with **FastAPI**. All interactive endpoints are documented via Swagger / OpenAPI at `/docs` and ReDoc at `/redoc`.

- **Base URL**: `http://localhost/api/v1` (via Nginx) or `http://localhost:8000/api/v1` (Direct Backend)
- **Content Type**: `application/json`
- **Authentication**: Bearer Token in `Authorization: Bearer <JWT_TOKEN>` header

---

## 1. Authentication Router (`/api/v1/auth`)

### 1.1 Register New Customer
- **Endpoint**: `POST /api/v1/auth/register`
- **Description**: Registers a new customer and returns user profile with JWT access token.
- **Request Body**:
  ```json
  {
    "email": "customer@example.com",
    "password": "SecurePassword@123",
    "full_name": "John Doe"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "id": 3,
    "email": "customer@example.com",
    "full_name": "John Doe",
    "role": "customer",
    "is_active": true,
    "created_at": "2026-11-11T12:00:00"
  }
  ```

### 1.2 User Login
- **Endpoint**: `POST /api/v1/auth/login`
- **Description**: Authenticates credentials and returns a signed JWT token.
- **Request Body**:
  ```json
  {
    "email": "demo@shopsmart.ai",
    "password": "Demo@123"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "bearer",
    "user": {
      "id": 2,
      "email": "demo@shopsmart.ai",
      "full_name": "Demo Shopper",
      "role": "customer"
    }
  }
  ```

### 1.3 Get Current User Profile
- **Endpoint**: `GET /api/v1/auth/me`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response** (`200 OK`): Returns current authenticated user record.

---

## 2. Categories Router (`/api/v1/categories`)

### 2.1 List All Categories
- **Endpoint**: `GET /api/v1/categories`
- **Response** (`200 OK`): Returns array of categories with product counts.
  ```json
  [
    {
      "id": 1,
      "name": "Smartphones & Mobile",
      "slug": "smartphones-mobile",
      "description": "Next-gen flagship and mid-range mobile devices",
      "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80",
      "product_count": 8
    }
  ]
  ```

---

## 3. Products Router (`/api/v1/products`)

### 3.1 List & Filter Products
- **Endpoint**: `GET /api/v1/products`
- **Query Parameters**:
  - `category_id` (int, optional): Filter by category ID.
  - `brand` (string, optional): Filter by manufacturer brand.
  - `min_price` (float, optional): Minimum price threshold in INR.
  - `max_price` (float, optional): Maximum price threshold in INR.
  - `min_rating` (float, optional): Minimum average customer rating (1.0 - 5.0).
  - `sort_by` (string, default: `"featured"`): Options: `price_asc`, `price_desc`, `rating`, `newest`, `popular`.
  - `search` (string, optional): Keyword search matching title, brand, description.
  - `page` (int, default: 1): Pagination page number.
  - `limit` (int, default: 12): Number of items per page.
- **Response** (`200 OK`):
  ```json
  {
    "items": [
      {
        "id": 1,
        "title": "Apple iPhone 15 Pro Max (256GB)",
        "slug": "apple-iphone-15-pro-max-256gb",
        "description": "Titanium design, A17 Pro chip, 48MP main camera...",
        "price": 149900.0,
        "original_price": 159900.0,
        "stock": 25,
        "brand": "Apple",
        "rating": 4.9,
        "rating_count": 342,
        "image_url": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80",
        "is_featured": true,
        "category_id": 1,
        "category_name": "Smartphones & Mobile"
      }
    ],
    "total": 48,
    "page": 1,
    "pages": 4
  }
  ```

### 3.2 Get Single Product Details
- **Endpoint**: `GET /api/v1/products/{id}`
- **Response** (`200 OK`): Complete product record including JSON technical specifications and reviews.

---

## 4. Artificial Intelligence Router (`/api/v1/ai`)

### 4.1 Grounded AI Conversational Shopping Concierge
- **Endpoint**: `POST /api/v1/ai/chat`
- **Description**: Submits shopper dialogue to Google Gemini 3.8 Flash, grounded with real catalog context.
- **Request Body**:
  ```json
  {
    "message": "Can you recommend a premium ultrabook for software engineering with at least 16GB RAM?",
    "conversation_history": []
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "reply": "For software engineering, I highly recommend the **Apple MacBook Air M3 (13.6-inch, 16GB, 512GB SSD)** priced at ₹1,34,900...",
    "recommended_products": [
      {
        "id": 9,
        "title": "Apple MacBook Air M3 (13.6-inch, 16GB, 512GB SSD)",
        "price": 134900.0,
        "rating": 4.9,
        "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80"
      }
    ]
  }
  ```

### 4.2 Natural Language Smart Search
- **Endpoint**: `GET /api/v1/ai/smart-search?q=affordable+laptops+under+50000`
- **Description**: Parses budget numbers, category intent, and keywords from natural language into catalog filters.
- **Response** (`200 OK`):
  ```json
  {
    "extracted_filters": {
      "query_text": "affordable laptops under 50000",
      "category_hint": "Laptops & Computing",
      "max_price": 50000.0,
      "min_rating": null
    },
    "results_count": 8,
    "results": [...]
  }
  ```

### 4.3 Multimodal Visual Search & Product Identification
- **Endpoint**: `POST /api/v1/ai/visual-search`
- **Request Body**:
  ```json
  {
    "image_base64": "data:image/jpeg;base64,...",
    "image_url": null,
    "description_hint": "optional fallback hint"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "matched_category": "Smartphones & Audio",
    "identified_product": {
      "category": "Smartphones & Audio",
      "brand": "Sony",
      "model": "WH-1000XM5",
      "product_name": "Sony WH-1000XM5 Wireless Headphones",
      "visual_attributes": ["Over-Ear", "Matte Black", "Cushioned Headband"],
      "specifications": { "Driver": "30mm", "ANC": "Yes" }
    },
    "confidence_score": 0.94,
    "search_method": "gemini_multimodal_vision",
    "ai_vision_used": true,
    "method_explanation": "Analyzed uploaded image pixels using Google Gemini (gemini-3.8-flash)...",
    "matched_products": [...],
    "retailer_comparison": { "lowest_price_recommendation": {...}, "retailer_offers": [...] }
  }
  ```
  > *Honesty Note*: When `GEMINI_API_KEY` is unconfigured, `ai_vision_used` is `false` and `search_method` is `metadata_similarity_fallback`.

### 4.4 Content-Based Product Recommendations (Scikit-Learn)
- **Endpoint**: `GET /api/v1/ai/recommendations/{product_id}?limit=4`
- **Description**: Computes cosine similarity across the TF-IDF feature space of product metadata.
- **Response** (`200 OK`): Returns top $k$ items with highest similarity score.

### 4.5 Product Spec Comparison Matrix
- **Endpoint**: `POST /api/v1/ai/compare`
- **Request Body**:
  ```json
  {
    "product_ids": [9, 10]
  }
  ```
- **Response** (`200 OK`): Side-by-side spec comparison matrix with AI buyer evaluation.

### 4.6 AI Review Sentiment Synthesis
- **Endpoint**: `GET /api/v1/ai/reviews-summary/{product_id}`
- **Response** (`200 OK`): Analyzes customer reviews and summarizes pros, cons, and buyer verdict.

---

## 5. Shopping Cart Router (`/api/v1/cart`)

- `GET /api/v1/cart`: Get current user cart and line items.
- `POST /api/v1/cart/items`: Add item to cart (`{ product_id: 1, quantity: 1 }`).
- `PUT /api/v1/cart/items/{item_id}`: Update quantity (`{ quantity: 2 }`).
- `DELETE /api/v1/cart/items/{item_id}`: Remove item from cart.
- `DELETE /api/v1/cart`: Clear entire shopping cart.

---

## 6. Wishlist Router (`/api/v1/wishlist`)

- `GET /api/v1/wishlist`: Retrieve bookmarked items for authenticated user.
- `POST /api/v1/wishlist/toggle/{product_id}`: Add or remove product from wishlist (returns active status).

---

## 7. Orders & Simulated Payments Router (`/api/v1/orders`)

### 7.1 Place Order & Process Payment
- **Endpoint**: `POST /api/v1/orders/checkout`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Request Body**:
  ```json
  {
    "shipping_address": {
      "full_name": "Demo Shopper",
      "address_line": "123 Tech Park, MG Road",
      "city": "Bengaluru",
      "state": "Karnataka",
      "postal_code": "560001",
      "phone": "+91 9876543210"
    },
    "payment_method": "credit_card",
    "coupon_code": "SMART10",
    "simulate_failure": false
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "order_number": "ORD-20261111-EFD908",
    "status": "PROCESSING",
    "total_amount": 444880.0,
    "discount_amount": 1500.0,
    "tax_amount": 79808.4,
    "final_amount": 523188.4,
    "payment": {
      "transaction_id": "TXN-MOCK-3B9A8C",
      "method": "credit_card",
      "status": "SUCCESS",
      "academic_disclaimer": "Simulated payment for academic demonstration only"
    }
  }
  ```

### 7.2 Get Order History
- **Endpoint**: `GET /api/v1/orders`
- **Response** (`200 OK`): List of all past orders placed by user.

### 7.3 Get Specific Order Details
- **Endpoint**: `GET /api/v1/orders/{order_number}`
- **Response** (`200 OK`): Itemized order details and invoice.

---

## 8. Coupons Router (`/api/v1/coupons`)

- `POST /api/v1/coupons/validate`: Validates coupon code against cart subtotal.
  - Active Codes:
    - `SMART10`: 10% off up to ₹1,500 (Minimum purchase: ₹2,000)
    - `WELCOME15`: 15% off up to ₹2,500 (Minimum purchase: ₹3,000)
    - `SUPER20`: 20% off up to ₹5,000 (Minimum purchase: ₹10,000)
    - `COLLEGE500`: Flat ₹500 off (Minimum purchase: ₹1,500)

---

## 9. Administrator Router (`/api/v1/admin`)

*(Requires Admin JWT Token)*

- `GET /api/v1/admin/dashboard`: Real-time aggregated business metrics:
  - `total_revenue`, `total_orders`, `total_products`, `total_customers`, `pending_orders`, `low_stock_products`, `recent_orders`.
- `GET /api/v1/admin/analytics`: Daily sales figures and category distributions.
- `POST /api/v1/admin/products`: Create new product.
- `PUT /api/v1/admin/products/{id}`: Edit product details, price, or inventory count.
- `DELETE /api/v1/admin/products/{id}`: Delete product from catalog.
- `GET /api/v1/admin/orders`: List all orders across all customers.
- `PUT /api/v1/admin/orders/{id}/status`: Update order fulfillment status (`PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
- `GET /api/v1/admin/users`: List registered customer directory.

---

## 10. Snap2Price Router (`/api/v1/snap2price`)

### 10.1 List Comparable Catalog Products
- **Endpoint**: `GET /api/v1/snap2price/products?q=MacBook&limit=24`
- **Response** (`200 OK`): Returns comparable exact-model products with lowest/highest retailer prices, max savings, and adapter configuration statuses.

### 10.2 Multi-Platform Exact-Model Price Comparison
- **Endpoint**: `GET /api/v1/snap2price/compare?product_id=1` (also supports `q`, `brand`, `model`)
- **Response** (`200 OK`):
  ```json
  {
    "product": { "id": 1, "name": "Apple MacBook Air M3 (13.6-inch)", "model_number": "APPL-APPLMACBAIR-001", "specifications": {...} },
    "exact_model_matched": true,
    "canonical_model_number": "APPL-APPLMACBAIR-001",
    "contains_simulated_data": true,
    "data_disclaimer": "Retailer prices shown use clearly labelled Reference Simulated Adapter data for academic demonstration unless affiliate API credentials are configured.",
    "retailer_offers": [
      {
        "retailer_name": "Flipkart",
        "current_price": 110290.0,
        "original_price": 124900.0,
        "discount_percentage": 11.7,
        "delivery_charge": 0.0,
        "total_landed_price": 110290.0,
        "product_url": "https://www.flipkart.com/search?q=...",
        "url_verified": true,
        "is_simulated": true,
        "data_source_label": "Reference Simulated Retailer Feed (Academic Demo)"
      }
    ],
    "lowest_price_recommendation": { "retailer_name": "Flipkart", "total_landed_price": 110290.0, "savings_vs_highest_retailer": 9500.0 }
  }
  ```

### 10.3 Price History Tracking
- `GET /api/v1/snap2price/price-history/{product_id}`: Returns Recharts multi-series dataset (`chart_data`), `lowest_recorded_price`, `highest_recorded_price`, `latest_recorded_price`, `average_price`, `trend_direction`, and timestamped `history_records`.
- `POST /api/v1/snap2price/price-history/{product_id}/record`: Appends a price observation (`{ retailer_name, price, is_simulated }`) and evaluates active price alerts for that product.

### 10.4 Target Price-Drop Alerts & Notifications *(Requires Customer JWT Token)*
- `GET /api/v1/snap2price/alerts`: Lists user's configured alerts and nested notification delivery logs.
- `POST /api/v1/snap2price/alerts`: Creates a new target price alert (`{ product_id, target_price, notification_channel, notification_target }`). Supported channels: `email`, `aws_sns`, `in_app`.
- `PATCH /api/v1/snap2price/alerts/{alert_id}`: Update target price or pause/resume alert (`{ target_price, is_active }`).
- `DELETE /api/v1/snap2price/alerts/{alert_id}`: Delete an alert.
- `POST /api/v1/snap2price/alerts/check-now?simulate_drop_alert_id={id}`: Runs background price checking immediately; optional `simulate_drop_alert_id` simulates a price drop below target for academic demo verification.
- `GET /api/v1/snap2price/notifications`: Returns historical notification logs (`delivery_status`: `sent_smtp`, `sent_aws_sns`, `simulated_delivered`).

### 10.5 Retailer URL Verification Utility
- `POST /api/v1/snap2price/validate-url`: Validates `{ "url": "https://..." }` against strict HTTPS and trusted domain allowlists.
