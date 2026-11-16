import pytest

def test_smart_search_nlp_budget(client):
    res = client.post(
        "/api/v1/ai/smart-search",
        json={"query": "Show me affordable laptops under 50000"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "interpreted_filters" in data
    assert data["interpreted_filters"]["max_price"] == 50000.0
    assert len(data["results"]) > 0

def test_smart_search_brand_and_audio(client):
    res = client.post(
        "/api/v1/ai/smart-search",
        json={"query": "Find Apple headphones"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total"] > 0

def test_ai_chat_assistant(client):
    res = client.post(
        "/api/v1/ai/chat",
        json={
            "message": "Can you recommend a lightweight laptop for a college student?",
            "history": []
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data["reply"]) > 0
    assert len(data["suggested_products"]) > 0
    assert len(data["quick_actions"]) > 0

def test_ai_visual_search(client):
    res = client.post(
        "/api/v1/ai/visual-search",
        json={
            "description_hint": "Modern wireless gaming headphones",
            "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data["matched_products"]) > 0
    assert "search_method" in data
    assert data["confidence_score"] > 0.5

def test_ai_product_comparison(client):
    prods = client.get("/api/v1/products?page_size=2").json()["items"]
    ids = [prods[0]["id"], prods[1]["id"]]
    
    res = client.post(
        "/api/v1/ai/compare",
        json={"product_ids": ids}
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data["products"]) == 2
    assert "ai_comparison_verdict" in data
    assert len(data["comparison_matrix"]) >= 4

def test_ai_recommendations(client):
    res = client.get("/api/v1/ai/recommendations?strategy=trending")
    assert res.status_code == 200
    data = res.json()
    assert len(data["recommendations"]) > 0
