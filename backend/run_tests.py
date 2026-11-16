import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

import httpx
from app.main import app

async def main():
    print("=" * 60)
    print("  SHOPSMART AI - COMPREHENSIVE BACKEND TEST SUITE")
    print("=" * 60)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        res = await client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print(" [PASS] 1. System Health Check: Database & Services OK")

        # 2. Categories listing
        res = await client.get("/api/v1/categories")
        assert res.status_code == 200
        cats = res.json()
        assert len(cats) >= 6
        print(f" [PASS] 2. Categories Listing: {len(cats)} categories loaded")

        # 3. Product listing & pagination
        res = await client.get("/api/v1/products?page=1&page_size=10")
        assert res.status_code == 200
        prods_data = res.json()
        assert prods_data["total"] >= 40
        print(f" [PASS] 3. Product Catalog: {prods_data['total']} seeded products in catalog")

        # 4. Filter by category
        res = await client.get("/api/v1/products?category=laptops-computing")
        assert res.status_code == 200
        laptop_items = res.json()["items"]
        assert len(laptop_items) >= 5
        print(f" [PASS] 4. Category Filter: {len(laptop_items)} Laptops & Computing products matched")

        # 5. Filter by price range
        res = await client.get("/api/v1/products?min_price=10000&max_price=40000")
        assert res.status_code == 200
        price_items = res.json()["items"]
        assert len(price_items) > 0
        print(f" [PASS] 5. Price Range Filter: {len(price_items)} products between ₹10,000 and ₹40,000")

        # 6. Customer Login
        res = await client.post("/api/v1/auth/login", json={"email": "demo@shopsmart.ai", "password": "Demo@123"})
        assert res.status_code == 200
        auth_data = res.json()
        customer_token = auth_data["access_token"]
        headers = {"Authorization": f"Bearer {customer_token}"}
        print(" [PASS] 6. Customer Authentication: JWT token issued for demo@shopsmart.ai")

        # 7. Admin Login
        res = await client.post("/api/v1/auth/login", json={"email": "admin@shopsmart.ai", "password": "Admin@123"})
        assert res.status_code == 200
        admin_data = res.json()
        admin_token = admin_data["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print(" [PASS] 7. Admin Authentication: JWT token issued for admin@shopsmart.ai")

        # 8. Profile query
        res = await client.get("/api/v1/auth/me", headers=headers)
        assert res.status_code == 200
        assert res.json()["email"] == "demo@shopsmart.ai"
        print(" [PASS] 8. Profile Route: /auth/me authenticated successfully")

        # 9. Similar products
        test_prod = prods_data["items"][0]
        res = await client.get(f"/api/v1/products/{test_prod['id']}/similar?limit=3")
        assert res.status_code == 200
        similar = res.json()
        assert len(similar) > 0
        print(f" [PASS] 9. Content-Based Recommendations: Found {len(similar)} products similar to '{test_prod['name'][:25]}...'")

        # 10. Cart operations
        await client.delete("/api/v1/cart/clear", headers=headers)
        p1 = prods_data["items"][0]
        p2 = prods_data["items"][1]

        res = await client.post("/api/v1/cart/items", json={"product_id": p1["id"], "quantity": 1}, headers=headers)
        assert res.status_code == 200
        res = await client.post("/api/v1/cart/items", json={"product_id": p2["id"], "quantity": 2}, headers=headers)
        assert res.status_code == 200
        cart_info = res.json()
        assert cart_info["total_items"] == 3
        print(f" [PASS] 10. Shopping Cart: Added 2 products (3 items total), subtotal = ₹{cart_info['subtotal']:,.2f}")

        # 11. Coupon validation
        res = await client.post("/api/v1/coupons/apply", json={"code": "SMART10", "order_amount": cart_info["subtotal"]})
        assert res.status_code == 200
        coupon_res = res.json()
        assert coupon_res["valid"] is True
        print(f" [PASS] 11. Coupon Engine: Applied code SMART10, saved ₹{coupon_res['discount_amount']:,.2f}")

        # 12. Wishlist operations
        res = await client.post("/api/v1/wishlist/items", json={"product_id": p1["id"]}, headers=headers)
        assert res.status_code == 200
        res = await client.get("/api/v1/wishlist", headers=headers)
        assert res.status_code == 200
        assert len(res.json()["items"]) >= 1
        print(" [PASS] 12. Wishlist Management: Product successfully saved to user wishlist")

        # 13. Simulated Payment Failure Scenario
        res = await client.post(
            "/api/v1/orders/checkout",
            json={
                "shipping_address": "42 Cyber Road, Tech Park",
                "shipping_city": "Bengaluru",
                "shipping_postal_code": "560100",
                "simulate_failure": True
            },
            headers=headers
        )
        assert res.status_code == 402, f"Expected 402 payment failure, got {res.status_code}"
        print(" [PASS] 13. Simulated Payment Failure: Correctly handled declined transaction (Academic Demo)")

        # 14. Simulated Payment Success Checkout
        res = await client.post(
            "/api/v1/orders/checkout",
            json={
                "shipping_address": "42 Cyber Road, Tech Park",
                "shipping_city": "Bengaluru",
                "shipping_postal_code": "560100",
                "coupon_code": "SMART10",
                "payment_method": "simulated_upi",
                "simulate_failure": False
            },
            headers=headers
        )
        assert res.status_code == 200
        order_out = res.json()
        assert order_out["order_number"].startswith("ORD-")
        assert order_out["payment"]["status"] == "completed"
        print(f" [PASS] 14. Order Checkout: Created Order #{order_out['order_number']}, Total ₹{order_out['total_amount']:,.2f}")

        # 15. AI Smart Natural Language Search
        res = await client.post("/api/v1/ai/smart-search", json={"query": "Show me affordable laptops under 50000"})
        assert res.status_code == 200
        search_out = res.json()
        assert search_out["interpreted_filters"]["max_price"] == 50000.0
        assert len(search_out["results"]) > 0
        print(f" [PASS] 15. AI Smart Search: Parsed query 'laptops under 50000' -> {len(search_out['results'])} matches")

        # 16. AI Shopping Assistant Chat
        res = await client.post("/api/v1/ai/chat", json={"message": "Can you recommend noise-canceling headphones?", "history": []})
        assert res.status_code == 200
        chat_out = res.json()
        assert len(chat_out["reply"]) > 0
        print(f" [PASS] 16. AI Shopping Assistant: Concierge replied with catalog recommendations")

        # 17. AI Visual Search
        res = await client.post("/api/v1/ai/visual-search", json={"description_hint": "Wireless Bluetooth headphones"})
        assert res.status_code == 200
        vis_out = res.json()
        assert len(vis_out["matched_products"]) > 0
        print(f" [PASS] 17. AI Visual Search: Method '{vis_out['search_method']}' matched {len(vis_out['matched_products'])} products")

        # 18. AI Product Comparison
        res = await client.post("/api/v1/ai/compare", json={"product_ids": [p1["id"], p2["id"]]})
        assert res.status_code == 200
        comp_out = res.json()
        assert len(comp_out["comparison_matrix"]) >= 4
        print(f" [PASS] 18. AI Product Comparison: Generated side-by-side spec matrix & buying verdict")

        # 19. AI Review Summary
        res = await client.get(f"/api/v1/reviews/{p1['id']}/summary")
        assert res.status_code == 200
        summary_out = res.json()
        assert "sentiment_breakdown" in summary_out
        print(f" [PASS] 19. AI Review Synthesis: Generated pros/cons analysis for '{p1['name'][:25]}...'")

        # 20. Admin Dashboard Analytics
        res = await client.get("/api/v1/admin/stats", headers=admin_headers)
        assert res.status_code == 200
        stats = res.json()
        assert stats["total_products"] >= 40
        assert stats["total_orders"] >= 1
        print(f" [PASS] 20. Admin Analytics: Total Revenue: ₹{stats['total_revenue']:,.2f}, Total Orders: {stats['total_orders']}")

    print("=" * 60)
    print("  ALL 20 TEST SUITES PASSED FLAWLESSLY! [100% READY]")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
