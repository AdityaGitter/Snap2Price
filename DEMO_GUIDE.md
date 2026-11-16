# ShopSmart AI – Academic Viva Voce & Demonstration Guide

This guide is designed to help you conduct a polished, high-scoring final-year project demonstration for college faculty and external evaluators.

---

## ⏱️ Part 1: The 3-Minute Elevator Pitch

When asked *"Tell us about your project"*, deliver this structured explanation:

> *"Good morning respected evaluators. Today I am presenting **ShopSmart AI (enhanced with Snap2Price)**, an intelligent visual shopping and multi-platform price comparison platform built with Generative Multimodal AI, Scikit-learn, and cloud-native DevOps automation.*
> 
> *Traditional e-commerce platforms force shoppers to manually jump between Amazon, Flipkart, Croma, and Reliance Digital tabs while guessing when prices will drop. ShopSmart AI + Snap2Price solves this with:*
> 1. *Google Gemini 3.8 Flash multimodal product identification, conversational catalog grounding, and smart budget NLP search.*
> 2. *A **Snap2Price Engine** featuring a pluggable Retailer Adapter architecture across Amazon India, Flipkart, Croma, and Reliance Digital—verifying exact model parity, tracking 30-day historical price charts via Recharts, and monitoring target price drops with Email SMTP / AWS SNS notifications via a dedicated background worker.*
> 3. *Scikit-learn TF-IDF & Cosine Similarity content-based recommendation engine.*
> 
> *On the DevOps side, the platform runs across 6 Docker containers (`postgres`, `redis`, `backend`, `price-worker`, `frontend`, `nginx`), validated automatically via GitHub Actions CI/CD, and provisioned on AWS EC2 using Terraform Infrastructure as Code."*
> 
> *Let me demonstrate the live system starting with the customer experience and moving into the AI features and administrative controls."*

---

## 🎯 Part 2: Step-by-Step Live Demonstration Script

Follow this sequential click-through path during your demonstration:

### Step 1: Storefront Exploration (`/`)
1. Open [http://localhost](http://localhost) (or your deployed EC2 public IP).
2. Point out the clean UI: light background, dark navy typography, and purple/indigo accents.
3. Show the **Hero Banner**, Category Grid (6 seeded categories), and **AI Recommended Products** carousel.
4. Click on **Products** in the navigation bar.

### Step 2: Catalog Filtering & Natural Language Smart Search (`/products`)
1. On `/products`, demonstrate the **instant keyword search**, category selection, and price slider.
2. Demonstrate **AI Smart Search**:
   - In the search bar, type: `Show me affordable laptops under 50000`
   - Hit Enter. Point out that the system didn't just look for the literal string; the backend extracted:
     - Target category: *Laptops & Computing*
     - Maximum budget: *₹50,000*
     - Matched items filtered from the database in real time.

### Step 3: Snap2Price AI Visual Product Identification (`/visual-search`)
1. Click **Visual** in the navbar.
2. Upload a real product photograph or select a Demo Preset.
3. Click **Search Catalog by Image**.
4. Point out two critical highlights for faculty:
   - **Honest Method Disclosure**: When a `GEMINI_API_KEY` is configured, Google Gemini analyzes the uploaded image pixels to extract Category, Brand, Exact Model, Visual Attributes, and Specifications (`gemini_multimodal_vision`). If the API key is omitted during offline grading, the badge explicitly states **Metadata Similarity Fallback** — never falsely claiming pixel understanding.
   - **Direct Retailer Comparison**: Right below the identification box, point out the live **Snap2Price Multi-Retailer Match** panel showing prices across **Amazon India, Flipkart, Croma, and Reliance Digital** for that matched model.

### Step 4: Multi-Platform Price Comparison (`/price-comparison`)
1. Click **Compare Prices** in the navbar (or **Full Comparison** from visual search).
2. Search for a model like `MacBook Air M3` or `Sony WH-1000XM5`.
3. Show the faculty:
   - Exact Model Verification (`Exact Model: ...`) and normalized specs matched across all 4 retailers.
   - Clear **Simulated Reference Adapter Notice** banner (`Mock Adapter` vs `Live API` per retailer).
   - **Lowest-Price Winner** box calculating total landed cost (`Price + Delivery Fee`) and savings vs the highest-priced retailer.
   - Click **"Open Best Deal on `<Retailer>` ↗"** (`https://...` verified link opening external merchant page, separated from ShopSmart AI's internal demo checkout).

### Step 5: 30-Day Price History & Target Price Drop Alerts (`/price-history/:id` & `/price-alerts`)
1. Click **30-Day Price History** from the comparison page.
2. Point out the 4 KPI summary cards (**Lowest Recorded**, **Highest Recorded**, **Latest Observed**, **Historical Average**), the trend indicator (`Dropping` / `Rising` / `Stable`), and the **Recharts** multi-retailer timeline curve.
3. Navigate to `/price-alerts` (logged in as `demo@shopsmart.ai` / `Demo@123`).
4. Create a new Price Alert (or use the seeded active alert), pick **Email** or **AWS SNS**, and click **Simulate Drop (Demo)**!
5. Watch the price drop trigger immediately, change alert status to `triggered`, log a record inside **Triggered Alert Notification History**, and provide a direct verified buy button.

### Step 6: Conversational Shopping Assistant (`/assistant` or floating button)
1. Click the floating **"Ask ShopSmart AI"** button at the bottom right.
2. Type a complex shopping question:
   - *"I am a college computer science student looking for a fast laptop for programming and light gaming. What do you recommend?"*
3. Show the faculty the response citing grounded catalog models & prices with clickable product cards.

### Step 7: Product Details, Internal Demo Cart & Simulated Checkout (`/products/:id` -> `/cart` -> `/checkout`)
1. On `/products/:id`, show technical specs, Scikit-learn TF-IDF **Similar Products**, AI **Review Summary**, and click **Add to Demo Cart**.
2. Go to `/cart`, apply promo code `SMART10`, then proceed to `/checkout` (signed in as `demo@shopsmart.ai` / `Demo@123`).
3. Demonstrate both **Simulate Payment Failure** (error handling) and **Success** (`ORD-...` receipt with `TXN-MOCK-...`).

### Step 8: Admin Dashboard & Analytics (`/admin`)
1. Log out and sign in as `admin@shopsmart.ai` / `Admin@123`.
2. Navigate to `/admin` -> inspect metrics, inventory CRUD (`/admin/products`), order fulfillment (`/admin/orders`), customer directory, and Recharts analytics (`/admin/analytics`).

---

## 💡 Part 3: Frequently Asked Questions by Faculty (and Best Answers)

### Q1: "How does your recommendation engine work?"
**Answer:**
> *"We implemented a dual-tier architecture. For product-to-product similarity, we use Scikit-learn's `TfidfVectorizer` to extract n-grams from product titles, categories, brands, and descriptions. We then calculate the Cosine Similarity between the normalized feature vectors. For personalized recommendations, we track the user's browsing and purchase history in the database, compute a weighted centroid user profile vector, and recommend products with the highest cosine score that the user hasn't purchased yet."*

### Q2: "How do you prevent the Gemini AI from hallucinating prices or products?"
**Answer:**
> *"We use **Retrieval-Augmented Grounding (RAG)**. When a shopper sends a prompt, the FastAPI backend first queries PostgreSQL for real, in-stock products matching the context. We then inject this structured catalog data into the system prompt passed to Google Gemini 3.8 Flash, instructing the model to act strictly as a grounded concierge that only quotes items and prices present in the context. This eliminates factual hallucinations."*

### Q3: "How does Snap2Price compare prices across retailers without brittle scraping?"
**Answer:**
> *"We implemented the **Adapter Design Pattern** (`BaseRetailerAdapter` with concrete adapters for Amazon India, Flipkart, Croma, and Reliance Digital). When authorized affiliate API keys (`AMAZON_PA_API_KEY`, `FLIPKART_AFFILIATE_TOKEN`, etc.) are configured in `.env`, the adapters query live partner APIs. When external credentials are absent in an academic environment, adapters serve clearly labelled Reference Simulated Feeds (`is_simulated=True`) rather than scraping blocked pages or misrepresenting mock prices as live."*

### Q4: "How do automated Price-Drop Alerts work in production?"
**Answer:**
> *"We run a dedicated Docker background worker container (`price-worker` executing `app.workers.price_monitor`) alongside the backend. It periodically evaluates active `price_alerts` against the lowest landed retailer price across `retailer_products`, records timestamped entries into `price_history`, and triggers notifications via Email SMTP (`smtplib`), AWS SNS (`boto3`), or transparent simulated delivery logs in `price_alert_notifications`."*

### Q5: "What is the purpose of Docker in your project?"
**Answer:**
> *"Docker solves the 'it works on my machine' dilemma by containerizing the application into 6 isolated microservices: React frontend, FastAPI backend, `price-worker` daemon, PostgreSQL database, Redis cache, and Nginx reverse proxy—booting seamlessly via `docker compose up --build -d`."*

### Q6: "How does your CI/CD pipeline & Terraform setup work?"
**Answer:**
> *"GitHub Actions executes Python tests (`run_tests.py`, `run_snap2price_tests.py`, and worker checks), compiles the Vite TypeScript production bundle, validates Docker Compose, builds container images, and deploys to AWS EC2 over SSH. Terraform provisions our VPC (`10.0.0.0/16`), public subnet, Internet Gateway, Security Group, Ubuntu EC2 instance, Elastic IP, and cloud-init Docker bootstrap script."*

---

## 🏆 Part 4: Technical Checklist for Submission

- [x] Core ShopSmart AI tests passing (20/20 test suites via `backend/run_tests.py`).
- [x] Snap2Price + full pytest suites passing (25/25 pytest cases via `pytest tests/` + 8/8 suites in `run_snap2price_tests.py`).
- [x] Frontend building cleanly (`tsc && vite build` in 7.54s with zero errors across 23 pages).
- [x] Dockerfiles and 6-service `docker-compose.yml` (+ `price-worker`) validated (`VALID=True`).
- [x] Nginx reverse proxy, GitHub Actions CI/CD, and Terraform scripts ready.
- [x] Default admin (`admin@shopsmart.ai` / `Admin@123`) and customer (`demo@shopsmart.ai` / `Demo@123`) accounts active.
- [x] Clear separation & disclaimers for Reference Mock Feeds vs Live APIs and Internal Demo Checkout vs External Merchant URLs.
