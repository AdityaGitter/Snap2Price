import asyncio
import base64
import json
import sys
import os
from unittest.mock import MagicMock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import httpx
from app.main import app
from app.database import SessionLocal
from app.models.product import Product
from app.models.snap2price import RetailerProduct
from app.ai.gemini_service import gemini_service
from app.services.retailer_adapter import validate_retailer_url


async def main():
    print("=" * 64)
    print("  SNAP2PRICE - END-TO-END FEATURE VERIFICATION SUITE")
    print("=" * 64)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Authenticate Demo Customer
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": "demo@shopsmart.ai", "password": "Demo@123"},
        )
        assert login_res.status_code == 200, login_res.text
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # ------------------------------------------------------------------
        # 1. Exact Product Matching & Comparable Catalog
        # ------------------------------------------------------------------
        res = await client.get("/api/v1/snap2price/products", params={"q": "MacBook"})
        assert res.status_code == 200, res.text
        comp_list = res.json()["items"]
        assert len(comp_list) >= 1, "Expected at least 1 comparable MacBook item"
        target_prod = comp_list[0]
        target_id = target_prod["id"]
        print(f" [PASS] 1. Exact Product Matching: Matched '{target_prod['name']}' (Model {target_prod['model_number']})")

        # ------------------------------------------------------------------
        # 2. Multi-Platform Retailer Price Comparison & Honest Labelling
        # ------------------------------------------------------------------
        res = await client.get("/api/v1/snap2price/compare", params={"product_id": target_id})
        assert res.status_code == 200, res.text
        comp_data = res.json()
        offers = comp_data["retailer_offers"]
        assert len(offers) == 4, f"Expected 4 retailers, got {len(offers)}"
        retailer_names = {o["retailer_name"] for o in offers}
        assert {"Amazon India", "Flipkart", "Croma", "Reliance Digital"} == retailer_names
        # Verify exact same model_number on all offers
        assert all(o["model_number"] == comp_data["canonical_model_number"] for o in offers)
        # Verify mock/reference honesty
        assert comp_data["contains_simulated_data"] is True
        assert all(o["is_simulated"] is True for o in offers)
        assert "Reference" in offers[0]["data_source_label"] or "Simulated" in offers[0]["data_source_label"]
        print(f" [PASS] 2. Retailer Comparison: Verified 4 exact-model offers ({comp_data['canonical_model_number']}) with explicit reference labels")

        # ------------------------------------------------------------------
        # 3. Lowest-Price Selection Verification
        # ------------------------------------------------------------------
        best_rec = comp_data["lowest_price_recommendation"]
        assert best_rec is not None
        min_landed = min(o["total_landed_price"] for o in offers if o["in_stock"])
        assert abs(best_rec["total_landed_price"] - min_landed) < 0.01
        assert best_rec["url_verified"] is True
        print(f" [PASS] 3. Lowest-Price Selection: Best deal = {best_rec['retailer_name']} at ₹{best_rec['total_landed_price']:,.2f}")

        # ------------------------------------------------------------------
        # 4. Retailer URL Validation (Trusted vs Malicious / Broken URLs)
        # ------------------------------------------------------------------
        valid_urls = [
            "https://www.amazon.in/dp/B0CX23V2ZK",
            "https://www.flipkart.com/search?q=iphone",
            "https://www.croma.com/searchB?q=macbook",
            "https://www.reliancedigital.in/search?q=sony",
        ]
        invalid_urls = [
            "http://www.amazon.in/insecure",
            "javascript:alert(1)",
            "https://evil-phishing-site.example.com/offer",
            "",
        ]
        for u in valid_urls:
            chk = validate_retailer_url(u)
            assert chk["valid"] is True, f"Expected valid URL {u}: {chk}"
        for u in invalid_urls:
            res_val = await client.post("/api/v1/snap2price/validate-url", json={"url": u})
            assert res_val.status_code == 200
            assert res_val.json()["valid"] is False, f"Expected invalid URL rejected: {u}"
        print(" [PASS] 4. Retailer URL Validation: Verified HTTPS allowlist & rejected unsafe/http/untrusted URLs")

        # ------------------------------------------------------------------
        # 5. Price History Storage & Analytics
        # ------------------------------------------------------------------
        res = await client.get(f"/api/v1/snap2price/price-history/{target_id}")
        assert res.status_code == 200, res.text
        hist_before = res.json()
        initial_obs = hist_before["statistics"]["total_observations"]
        assert initial_obs >= 4
        assert len(hist_before["chart_data"]) >= 1

        # Record a new timestamped observation
        new_obs_price = round(hist_before["statistics"]["latest_recorded_price"] - 1000.0, 2)
        rec_res = await client.post(
            f"/api/v1/snap2price/price-history/{target_id}/record",
            json={
                "retailer_name": "Amazon India",
                "price": new_obs_price,
                "is_simulated": True,
            },
        )
        assert rec_res.status_code == 200, rec_res.text
        hist_after = (await client.get(f"/api/v1/snap2price/price-history/{target_id}")).json()
        assert hist_after["statistics"]["total_observations"] == initial_obs + 1
        assert hist_after["statistics"]["lowest_recorded_price"] <= new_obs_price
        print(f" [PASS] 5. Price History Storage: Saved observation ₹{new_obs_price:,.2f} (total obs: {hist_after['statistics']['total_observations']}, trend: {hist_after['statistics']['trend_direction']})")

        # ------------------------------------------------------------------
        # 6. Price Alert Creation
        # ------------------------------------------------------------------
        # Pick a clean product and set target ₹5,000 below current lowest price
        db = SessionLocal()
        sample_p = db.query(Product).order_by(Product.id.desc()).first()
        sample_p_id = sample_p.id
        best_p_rp = (
            db.query(RetailerProduct)
            .filter(RetailerProduct.product_id == sample_p_id)
            .order_by(RetailerProduct.current_price.asc())
            .first()
        )
        curr_lowest = best_p_rp.current_price if best_p_rp else sample_p.price
        db.close()

        target_price = round(max(500.0, curr_lowest - 400.0), 2)
        create_res = await client.post(
            "/api/v1/snap2price/alerts",
            headers=headers,
            json={
                "product_id": sample_p_id,
                "target_price": target_price,
                "notification_channel": "email",
                "notification_target": "demo@shopsmart.ai",
            },
        )
        assert create_res.status_code == 200, create_res.text
        created_alert = create_res.json()
        alert_id = created_alert["id"]
        assert created_alert["status"] == "active"
        assert abs(created_alert["target_price"] - target_price) < 0.01
        print(f" [PASS] 6. Price Alert Creation: Alert #{alert_id} created for '{created_alert['product_name']}' (target ₹{target_price:,.2f} vs current ₹{curr_lowest:,.2f})")

        # ------------------------------------------------------------------
        # 7. Price-Drop Detection & Notification Delivery
        # ------------------------------------------------------------------
        check_res = await client.post(
            f"/api/v1/snap2price/alerts/check-now?simulate_drop_alert_id={alert_id}",
            headers=headers,
        )
        assert check_res.status_code == 200, check_res.text
        check_data = check_res.json()
        assert check_data["triggered"] is True
        assert check_data["delivery_status"] in ("simulated_delivered", "sent_smtp", "sent_aws_sns")

        # Verify persisted alert status + notification log entry
        alerts_list = (await client.get("/api/v1/snap2price/alerts", headers=headers)).json()
        matched_alert = next(a for a in alerts_list if a["id"] == alert_id)
        assert matched_alert["status"] == "triggered"
        assert len(matched_alert["notifications"]) >= 1

        notifs_list = (await client.get("/api/v1/snap2price/notifications", headers=headers)).json()
        assert any(n["alert_id"] == alert_id for n in notifs_list)
        print(f" [PASS] 7. Price-Drop Detection & Notification Delivery: Alert #{alert_id} triggered at ₹{check_data['simulated_new_price']:,.2f} -> status '{check_data['delivery_status']}'")

        # Clean up test alert
        del_res = await client.delete(f"/api/v1/snap2price/alerts/{alert_id}", headers=headers)
        assert del_res.status_code == 200

        # ------------------------------------------------------------------
        # 8. AI Product Identification (Honest Fallback vs Gemini Vision)
        # ------------------------------------------------------------------
        # A) Unconfigured Gemini key -> must honestly use metadata_similarity_fallback
        dummy_b64 = base64.b64encode(b"fake-image-bytes").decode()
        vis_fallback_res = await client.post(
            "/api/v1/ai/visual-search",
            json={"image_base64": f"data:image/jpeg;base64,{dummy_b64}", "description_hint": "Sony wireless headphones"},
        )
        assert vis_fallback_res.status_code == 200, vis_fallback_res.text
        vis_fb = vis_fallback_res.json()
        assert vis_fb["ai_vision_used"] is False
        assert vis_fb["search_method"] == "metadata_similarity_fallback"
        assert vis_fb["retailer_comparison"] is not None

        # B) Mock configured Gemini Vision client -> extracts model/brand/specs & connects to retailer comparison
        orig_client = gemini_service.client
        orig_key = gemini_service.api_key
        try:
            mock_resp = MagicMock()
            mock_resp.text = json.dumps({
                "category": "Laptops & Computing",
                "brand": "Apple",
                "model": "MacBook Air M3",
                "product_name": "Apple MacBook Air M3 (13.6-inch)",
                "product_type": "ultrabook laptop",
                "primary_color": "Space Gray",
                "visual_attributes": ["Slim aluminum unibody", "Space Gray", "13.6-inch Liquid Retina"],
                "specifications": {"Processor": "Apple M3", "Display": "13.6-inch Liquid Retina"},
                "search_keywords": ["Apple", "MacBook Air M3", "laptop"],
                "visual_description": "Ultra-thin Space Gray Apple MacBook Air laptop identified cleanly.",
            })
            mock_client = MagicMock()
            mock_client.models.generate_content.return_value = mock_resp
            gemini_service.client = mock_client
            gemini_service.api_key = "test-gemini-mock-key"

            vis_ai_res = await client.post(
                "/api/v1/ai/visual-search",
                json={"image_base64": f"data:image/jpeg;base64,{dummy_b64}"},
            )
            assert vis_ai_res.status_code == 200, vis_ai_res.text
            vis_ai = vis_ai_res.json()
            assert vis_ai["ai_vision_used"] is True
            assert vis_ai["search_method"] == "gemini_multimodal_vision"
            assert vis_ai["identified_product"]["brand"] == "Apple"
            assert vis_ai["identified_product"]["model"] == "MacBook Air M3"
            assert vis_ai["retailer_comparison"] is not None
            assert len(vis_ai["retailer_comparison"]["retailer_offers"]) == 4
            print(f" [PASS] 8. AI Product Identification: Verified both honest fallback AND Gemini multimodal identification ({vis_ai['identified_product']['brand']} {vis_ai['identified_product']['model']}) -> 4-retailer price comparison")
        finally:
            gemini_service.client = orig_client
            gemini_service.api_key = orig_key

    print("=" * 64)
    print("  ALL SNAP2PRICE TEST SUITES PASSED FLAWLESSLY! [100% READY]")
    print("=" * 64)


if __name__ == "__main__":
    asyncio.run(main())
