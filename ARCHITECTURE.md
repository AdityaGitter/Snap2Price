# ShopSmart AI – Detailed System Architecture & Engineering Specifications

This document provides an in-depth architectural breakdown of **ShopSmart AI**, illustrating data flows, AI inference pipelines, database relationships, and containerized deployment infrastructure.

---

## 1. High-Level Multi-Tier Architecture

```mermaid
flowchart TB
    subgraph Client Layer
        Browser[Client Web Browser / Mobile Device]
    end

    subgraph Edge & Reverse Proxy
        NginxProxy[Nginx Alpine Edge Proxy :80]
    end

    subgraph Presentation Tier
        ReactNginx[React 18 SPA on Nginx :80]
        ReactRoutes[23 Functional Pages & React Router]
        ZustandCtx[Auth, Cart, Wishlist & Toast Contexts]
    end

    subgraph Application & Worker Tier
        FastAPIServer[FastAPI Asynchronous Engine :8000]
        PriceWorker[Snap2Price Background Price Worker]
        RouterModules[11 Modular API Routers]
        PydanticSchemas[Pydantic V2 Request Validation]
        SQLAlchemyORM[SQLAlchemy 2.0 ORM Mappings]
        DirectBcrypt[Direct Bcrypt & JWT Security]
    end

    subgraph AI, ML & Adapter Intelligence
        GeminiFlash[Google Gemini 3.8 Flash SDK]
        SklearnEngine[Scikit-learn TF-IDF & Cosine Similarity]
        NLParser[Natural Language Budget & Intent Parser]
        VisionPipeline[Snap2Price Visual Identification + Fallback]
        RetailerAdapters[Amazon / Flipkart / Croma / Reliance Adapters]
        Notifier[SMTP Email / AWS SNS Dispatcher]
    end

    subgraph Storage & Persistence Tier
        PostgresDB[(PostgreSQL 16 - 17 Tables)]
        RedisStore[(Redis 7 In-Memory Cache)]
    end

    Browser -->|HTTP Requests| NginxProxy
    NginxProxy -->|Static Frontend Requests / | ReactNginx
    NginxProxy -->|REST API Requests /api/ | FastAPIServer
    ReactNginx --> ReactRoutes
    ReactRoutes --> ZustandCtx

    FastAPIServer --> RouterModules
    RouterModules --> PydanticSchemas
    RouterModules --> SQLAlchemyORM
    RouterModules --> DirectBcrypt

    RouterModules -->|AI Queries & Prompts| GeminiFlash
    RouterModules -->|Catalog Embeddings & Recs| SklearnEngine
    RouterModules --> NLParser
    RouterModules --> VisionPipeline
    RouterModules --> RetailerAdapters
    PriceWorker --> RetailerAdapters
    PriceWorker --> Notifier

    SQLAlchemyORM -->|Persistent Storage| PostgresDB
    PriceWorker -->|Monitor & Notify| PostgresDB
    FastAPIServer -->|Session & Query Caching| RedisStore
```

---

## 2. Snap2Price Visual Identification -> Comparison & Alert Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as Shopper
    participant UI as React Frontend (/visual-search & /price-comparison)
    participant API as FastAPI (/api/v1/ai/visual-search & /snap2price)
    participant Gemini as Google Gemini 3.8 Flash Vision
    participant Adapters as BaseRetailerAdapter Registry
    participant DB as PostgreSQL (retailer_products, price_history, price_alerts)
    participant Worker as price-worker Daemon

    User->>UI: Uploads product photo
    UI->>API: POST /api/v1/ai/visual-search
    alt Gemini API Key Configured
        API->>Gemini: Multimodal pixel analysis (category, brand, model, specs)
        Gemini-->>API: Returns structured JSON (ai_vision_used=true)
    else No API Key / Offline
        API->>API: Metadata similarity fallback (ai_vision_used=false — honest notice)
    end
    API->>Adapters: Compare exact model across Amazon, Flipkart, Croma & Reliance
    Adapters->>DB: Query exact model_number listings + HTTPS URL validation
    DB-->>API: Returns 4 retailer offers (explicit is_simulated flag if reference)
    API-->>UI: Renders identified specs + Lowest-Price Winner + external links
    User->>UI: Sets Target Price Alert on /price-alerts
    UI->>DB: Saves target threshold in price_alerts
    loop Every N Seconds
        Worker->>DB: Evaluates active price_alerts against best retailer prices
        Worker->>DB: Logs PriceAlertNotification + Email SMTP / AWS SNS dispatch
    end
```

---

## 2. Google Gemini 3.8 Flash Grounded AI Chat Sequence

The conversational shopping concierge utilizes **Retrieval-Augmented Grounding** to prevent factual hallucination:

```mermaid
sequenceDiagram
    autonumber
    actor User as Shopper
    participant UI as React Frontend (AIChatDrawer)
    participant API as FastAPI Backend (/api/v1/ai/chat)
    participant DB as PostgreSQL Database
    participant Gemini as Google Gemini 3.8 Flash Model

    User->>UI: Types: "What is the best laptop for computer science students under ₹80,000?"
    UI->>API: POST /api/v1/ai/chat { message, conversation_history }
    API->>DB: Query catalog items (category='Laptops', price <= 80000, in_stock=True)
    DB-->>API: Returns list of matching products with specs, ratings, and prices
    API->>API: Formats system prompt with grounded catalog context
    API->>Gemini: generate_content(model="gemini-3.8-flash", contents=[grounded_prompt])
    Gemini-->>API: Returns structured markdown answer citing exact models, specs & prices
    API-->>UI: Returns JSON response with AI text and recommended product cards
    UI-->>User: Displays message bubble and clickable product recommendation cards
```

---

## 3. Scikit-learn Content-Based Recommendation Pipeline

The recommendation engine translates text metadata into mathematical vectors to calculate cosine similarity:

```mermaid
flowchart LR
    subgraph Data Preparation
        P1[Title & Brand] --> Concat[Text Corpus Concatenation]
        P2[Category] --> Concat
        P3[Description & Specs] --> Concat
    end

    subgraph Vectorization
        Concat --> TFIDF[Scikit-Learn TfidfVectorizer]
        TFIDF -->|max_features=5000, ngram=(1,2)| Matrix[TF-IDF Feature Matrix]
    end

    subgraph Similarity Matrix
        Matrix --> Cosine[Cosine Similarity Calculation]
        Cosine --> SimScores[N x N Similarity Score Matrix]
    end

    subgraph Recommendation Inference
        QueryItem[Target Product ID] --> Lookup[Lookup Top K Scores]
        SimScores --> Lookup
        Lookup --> Rank[Rank & Filter In-Stock]
        Rank --> Output[Top Similar Product Recommendations]
    end
```

---

## 4. Database Entity-Relationship Diagram (17 Relational Tables)

```mermaid
erDiagram
    users {
        int id PK
        string email UK
        string hashed_password
        string full_name
        string role
        boolean is_active
        datetime created_at
    }

    categories {
        int id PK
        string name UK
        string slug UK
        string description
        string image_url
    }

    products {
        int id PK
        string title
        string slug UK
        string description
        float price
        float original_price
        int stock
        string brand
        float rating
        int rating_count
        string image_url
        json specifications
        boolean is_featured
        int category_id FK
        datetime created_at
    }

    retailer_products {
        int id PK
        int product_id FK
        string retailer_name
        string retailer_slug
        string brand
        string model_number
        float current_price
        float original_price
        float delivery_charge
        float rating
        string product_url
        string data_source
        boolean is_simulated
        datetime last_updated
    }

    price_history {
        int id PK
        int product_id FK
        int retailer_product_id FK
        string retailer_name
        float price
        float original_price
        boolean is_simulated
        datetime recorded_at
    }

    price_alerts {
        int id PK
        int user_id FK
        int product_id FK
        float target_price
        float latest_observed_price
        string notification_channel
        string status
        string notification_status
        boolean is_active
        datetime triggered_at
    }

    price_alert_notifications {
        int id PK
        int alert_id FK
        int user_id FK
        int product_id FK
        string retailer_name
        float observed_price
        string channel
        string delivery_status
        datetime sent_at
    }

    carts {
        int id PK
        int user_id FK
        datetime created_at
        datetime updated_at
    }

    cart_items {
        int id PK
        int cart_id FK
        int product_id FK
        int quantity
    }

    wishlists {
        int id PK
        int user_id FK
        datetime created_at
    }

    wishlist_items {
        int id PK
        int wishlist_id FK
        int product_id FK
    }

    orders {
        int id PK
        string order_number UK
        int user_id FK
        float total_amount
        float discount_amount
        float tax_amount
        float final_amount
        string status
        json shipping_address
        string coupon_code
        datetime created_at
    }

    order_items {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
        float unit_price
        float subtotal
    }

    payments {
        int id PK
        int order_id FK
        string payment_method
        string transaction_id UK
        float amount
        string status
        datetime created_at
    }

    reviews {
        int id PK
        int user_id FK
        int product_id FK
        int rating
        string comment
        datetime created_at
    }

    product_views {
        int id PK
        int user_id FK
        int product_id FK
        datetime viewed_at
    }

    coupons {
        int id PK
        string code UK
        float discount_percent
        float max_discount
        float min_purchase
        boolean is_active
        datetime expires_at
    }

    users ||--o{ carts : owns
    users ||--o{ wishlists : owns
    users ||--o{ orders : places
    users ||--o{ reviews : writes
    users ||--o{ product_views : generates
    users ||--o{ price_alerts : sets
    users ||--o{ price_alert_notifications : receives

    categories ||--o{ products : categorizes

    products ||--o{ cart_items : contains
    products ||--o{ wishlist_items : contains
    products ||--o{ order_items : contains
    products ||--o{ reviews : receives
    products ||--o{ product_views : tracks
    products ||--o{ retailer_products : listed_on
    products ||--o{ price_history : history_of
    products ||--o{ price_alerts : alerts_for

    retailer_products ||--o{ price_history : records
    price_alerts ||--o{ price_alert_notifications : logs

    carts ||--o{ cart_items : contains
    wishlists ||--o{ wishlist_items : contains
    orders ||--o{ order_items : contains
    orders ||--|| payments : paid_by
```

---

## 5. Docker Container Network & Volume Topology (6 Services)

All six application services are isolated inside an internal Docker bridge network (`shopsmart_network`):

```mermaid
graph TD
    subgraph Host Machine / AWS EC2
        Port80[Host Port 80]
        Port8000[Host Port 8000]
        Port3000[Host Port 3000]
        Port5432[Host Port 5432]
        Port6379[Host Port 6379]

        subgraph Docker Bridge Network: shopsmart_network
            NginxContainer[Container: shopsmart-nginx]
            FrontendContainer[Container: shopsmart-frontend]
            BackendContainer[Container: shopsmart-backend]
            WorkerContainer[Container: shopsmart-price-worker]
            PostgresContainer[Container: shopsmart-postgres]
            RedisContainer[Container: shopsmart-redis]
        end

        subgraph Persistent Docker Volumes
            VolPostgres[(Volume: shopsmart_postgres_data)]
            VolRedis[(Volume: shopsmart_redis_data)]
        end
    end

    Port80 --> NginxContainer
    Port8000 --> BackendContainer
    Port3000 --> FrontendContainer
    Port5432 --> PostgresContainer
    Port6379 --> RedisContainer

    NginxContainer -->|Internal HTTP :80| FrontendContainer
    NginxContainer -->|Internal HTTP :8000| BackendContainer

    BackendContainer -->|TCP :5432| PostgresContainer
    WorkerContainer -->|TCP :5432| PostgresContainer
    BackendContainer -->|TCP :6379| RedisContainer

    PostgresContainer --- VolPostgres
    RedisContainer --- VolRedis
```

---

## 6. Continuous Integration & Deployment (CI/CD) Workflow

```mermaid
flowchart TD
    GitPush[Developer Pushes Code to GitHub] --> Trigger[GitHub Actions Triggered on main/master]

    subgraph CI Pipeline
        subgraph Job 1: Backend & Snap2Price Tests
            SetupPy[Setup Python 3.11] --> InstallPy[Install pip requirements]
            InstallPy --> SpinRedis[Spin Up Ephemeral Redis Service]
            SpinRedis --> RunPytest[Execute run_tests.py + run_snap2price_tests.py + worker check]
        end

        subgraph Job 2: Frontend Build
            SetupNode[Setup Node.js 20] --> InstallNode[npm ci]
            InstallNode --> BuildVite[Execute tsc && vite build]
        end

        subgraph Job 3: Docker Build
            RunPytest & BuildVite --> ValidateCompose[docker compose config validation]
            ValidateCompose --> BuildBEImage[Build Backend Image]
            ValidateCompose --> BuildFEImage[Build Frontend Image]
        end
    end

    subgraph CD Pipeline
        BuildBEImage & BuildFEImage --> SSHDeploy[SSH Action to AWS EC2 Instance]
        SSHDeploy --> PullRepo[git pull origin main]
        PullRepo --> GenEnv[Inject Secure .env Configuration]
        GenEnv --> ComposeUp[docker compose up --build -d]
        ComposeUp --> HealthProbe[curl -f http://localhost/api/health]
        HealthProbe --> LiveNotification[Deployment Successful Notification]
    end
```
