import base64
import json
from unittest.mock import MagicMock

from app.ai.gemini_service import gemini_service
from app.services.retailer_adapter import validate_retailer_url
from app.workers.price_monitor import run_once


def _auth_headers(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "demo@shopsmart.ai", "password": "Demo@123"},
    )
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_product_matching_and_retailer_comparison(client):
    list_res = client.get("/api/v1/snap2price/products?q=MacBook")
    assert list_res.status_code == 200
    items = list_res.json()["items"]
    assert len(items) >= 1

    product_id = items[0]["id"]
    comp_res = client.get(f"/api/v1/snap2price/compare?product_id={product_id}")
    assert comp_res.status_code == 200
    data = comp_res.json()

    assert data["exact_model_matched"] is True
    offers = data["retailer_offers"]
    assert len(offers) == 4
    retailers = {o["retailer_name"] for o in offers}
    assert retailers == {"Amazon India", "Flipkart", "Croma", "Reliance Digital"}

    # Ensure identical model parity across retailers and explicit mock disclosure
    for o in offers:
        assert o["model_number"] == data["canonical_model_number"]
        assert o["is_simulated"] is True
        assert o["url_verified"] is True


def test_lowest_price_selection_with_delivery(client):
    list_res = client.get("/api/v1/snap2price/products?limit=1")
    product_id = list_res.json()["items"][0]["id"]

    comp = client.get(f"/api/v1/snap2price/compare?product_id={product_id}").json()
    offers = comp["retailer_offers"]
    lowest_rec = comp["lowest_price_recommendation"]

    expected_min = min(o["total_landed_price"] for o in offers if o["in_stock"])
    assert lowest_rec is not None
    assert abs(lowest_rec["total_landed_price"] - expected_min) < 0.01


def test_retailer_url_validation(client):
    assert validate_retailer_url("https://www.amazon.in/dp/B09V3KXJPB")["valid"] is True
    assert validate_retailer_url("https://www.flipkart.com/search?q=laptop")["valid"] is True
    assert validate_retailer_url("https://www.croma.com/searchB?q=sony")["valid"] is True
    assert validate_retailer_url("https://www.reliancedigital.in/search?q=tv")["valid"] is True

    for bad_url in [
        "http://www.amazon.in/insecure",
        "javascript:alert('xss')",
        "https://untrusted-phishing.example.net/deal",
        "",
    ]:
        res = client.post("/api/v1/snap2price/validate-url", json={"url": bad_url})
        assert res.status_code == 200
        assert res.json()["valid"] is False


def test_price_history_storage_and_statistics(client):
    product_id = client.get("/api/v1/snap2price/products?limit=1").json()["items"][0]["id"]

    before = client.get(f"/api/v1/snap2price/price-history/{product_id}").json()
    before_count = before["statistics"]["total_observations"]
    latest = before["statistics"]["latest_recorded_price"]

    test_price = round(max(200.0, latest - 250.0), 2)
    rec = client.post(
        f"/api/v1/snap2price/price-history/{product_id}/record",
        json={"retailer_name": "Flipkart", "price": test_price, "is_simulated": True},
    )
    assert rec.status_code == 200

    after = client.get(f"/api/v1/snap2price/price-history/{product_id}").json()
    assert after["statistics"]["total_observations"] == before_count + 1
    assert after["statistics"]["lowest_recorded_price"] <= test_price
    assert after["statistics"]["highest_recorded_price"] >= after["statistics"]["lowest_recorded_price"]
    assert len(after["chart_data"]) >= 1


def test_price_alert_creation_drop_detection_and_notification(client):
    headers = _auth_headers(client)
    items = client.get("/api/v1/snap2price/products?limit=5").json()["items"]
    target_item = items[-1]
    target_price = max(250.0, target_item["lowest_retailer_price"] - 300.0)

    create_res = client.post(
        "/api/v1/snap2price/alerts",
        headers=headers,
        json={
            "product_id": target_item["id"],
            "target_price": target_price,
            "notification_channel": "email",
            "notification_target": "demo@shopsmart.ai",
        },
    )
    assert create_res.status_code == 200
    alert = create_res.json()
    alert_id = alert["id"]
    assert alert["status"] == "active"

    # Trigger simulated drop below target and verify notification delivery
    drop_res = client.post(
        f"/api/v1/snap2price/alerts/check-now?simulate_drop_alert_id={alert_id}",
        headers=headers,
    )
    assert drop_res.status_code == 200
    drop_data = drop_res.json()
    assert drop_data["triggered"] is True
    assert drop_data["delivery_status"] in ("simulated_delivered", "sent_smtp", "sent_aws_sns")

    notifs = client.get("/api/v1/snap2price/notifications", headers=headers).json()
    assert any(n["alert_id"] == alert_id for n in notifs)

    # Clean up test alert
    assert client.delete(f"/api/v1/snap2price/alerts/{alert_id}", headers=headers).status_code == 200


def test_ai_visual_product_identification_honest_fallback_and_gemini(client):
    dummy_b64 = base64.b64encode(b"sample-image-bytes").decode()

    # Fallback mode must NEVER falsely report Gemini vision understanding
    fb_res = client.post(
        "/api/v1/ai/visual-search",
        json={"image_base64": f"data:image/jpeg;base64,{dummy_b64}", "description_hint": "Sony WH-1000XM5 headphones"},
    )
    assert fb_res.status_code == 200
    fb_data = fb_res.json()
    assert fb_data["ai_vision_used"] is False
    assert fb_data["search_method"] == "metadata_similarity_fallback"
    assert fb_data["retailer_comparison"] is not None

    # Mocked Gemini multimodal client identification -> feeds retailer comparison
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
            "primary_color": "Midnight",
            "visual_attributes": ["Slim aluminum unibody", "Dark finish"],
            "specifications": {"Processor": "Apple M3", "Display": "13.6-inch"},
            "search_keywords": ["Apple", "MacBook Air M3"],
            "visual_description": "Identified Apple MacBook Air M3 from product pixels.",
        })
        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_resp
        gemini_service.client = mock_client
        gemini_service.api_key = "mock-gemini-key"

        ai_res = client.post(
            "/api/v1/ai/visual-search",
            json={"image_base64": f"data:image/jpeg;base64,{dummy_b64}"},
        )
        assert ai_res.status_code == 200
        ai_data = ai_res.json()
        assert ai_data["ai_vision_used"] is True
        assert ai_data["search_method"] == "gemini_multimodal_vision"
        assert ai_data["identified_product"]["brand"] == "Apple"
        assert ai_data["identified_product"]["model"] == "MacBook Air M3"
        assert ai_data["retailer_comparison"] is not None
    finally:
        gemini_service.client = orig_client
        gemini_service.api_key = orig_key


def test_price_monitor_worker_once():
    summary = run_once()
    assert "checked_alerts" in summary
    assert "triggered_count" in summary
