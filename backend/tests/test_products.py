import pytest

def test_list_categories(client):
    res = client.get("/api/v1/categories")
    assert res.status_code == 200
    categories = res.json()
    assert len(categories) >= 6
    names = [c["name"] for c in categories]
    assert "Laptops & Computing" in names
    assert "Smartphones & Audio" in names

def test_list_products_pagination(client):
    res = client.get("/api/v1/products?page=1&page_size=8")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 40
    assert len(data["items"]) == 8

def test_filter_products_by_category(client):
    res = client.get("/api/v1/products?category=laptops-computing")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) > 0
    for p in data["items"]:
        assert p["category"]["name"] == "Laptops & Computing"

def test_filter_products_by_price_range(client):
    res = client.get("/api/v1/products?min_price=10000&max_price=30000")
    assert res.status_code == 200
    data = res.json()
    for p in data["items"]:
        assert 10000 <= p["price"] <= 30000

def test_product_detail_and_similar(client):
    # Get first product
    list_res = client.get("/api/v1/products?page_size=1")
    product = list_res.json()["items"][0]
    prod_id = product["id"]

    # Detail
    detail_res = client.get(f"/api/v1/products/{prod_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["name"] == product["name"]

    # Similar products
    similar_res = client.get(f"/api/v1/products/{prod_id}/similar?limit=4")
    assert similar_res.status_code == 200
    similar_items = similar_res.json()
    assert isinstance(similar_items, list)
