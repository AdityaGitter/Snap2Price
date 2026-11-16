import pytest

@pytest.fixture
def auth_headers(client):
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "demo@shopsmart.ai", "password": "Demo@123"}
    )
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_cart_operations(client, auth_headers):
    # Clear cart first
    client.delete("/api/v1/cart/clear", headers=auth_headers)

    # Get product
    prods = client.get("/api/v1/products?page_size=2").json()["items"]
    p1 = prods[0]
    p2 = prods[1]

    # Add p1 to cart
    add_res = client.post(
        "/api/v1/cart/items",
        json={"product_id": p1["id"], "quantity": 1},
        headers=auth_headers
    )
    assert add_res.status_code == 200
    cart_data = add_res.json()
    assert cart_data["total_items"] == 1
    assert cart_data["subtotal"] == p1["price"]

    # Add p2 to cart
    add_res2 = client.post(
        "/api/v1/cart/items",
        json={"product_id": p2["id"], "quantity": 2},
        headers=auth_headers
    )
    assert add_res2.status_code == 200
    assert add_res2.json()["total_items"] == 3

    # Check coupon application
    coupon_res = client.post(
        "/api/v1/coupons/apply",
        json={"code": "SMART10", "order_amount": add_res2.json()["subtotal"]}
    )
    assert coupon_res.status_code == 200
    assert coupon_res.json()["valid"] is True
    assert coupon_res.json()["discount_amount"] > 0

def test_checkout_workflow(client, auth_headers):
    # Ensure item in cart
    prods = client.get("/api/v1/products?page_size=1").json()["items"]
    client.post(
        "/api/v1/cart/items",
        json={"product_id": prods[0]["id"], "quantity": 1},
        headers=auth_headers
    )

    # Checkout
    order_res = client.post(
        "/api/v1/orders/checkout",
        json={
            "shipping_address": "42 Tech Boulevard, Silicon Campus",
            "shipping_city": "Bengaluru",
            "shipping_postal_code": "560001",
            "shipping_country": "India",
            "coupon_code": "SMART10",
            "payment_method": "simulated_card",
            "simulate_failure": False
        },
        headers=auth_headers
    )
    assert order_res.status_code == 200
    order_data = order_res.json()
    assert order_data["order_number"].startswith("ORD-")
    assert order_data["status"] == "processing"
    assert order_data["payment"]["status"] == "completed"

    # Verify Cart is now cleared
    cart_res = client.get("/api/v1/cart", headers=auth_headers)
    assert cart_res.json()["total_items"] == 0

def test_checkout_simulated_failure(client, auth_headers):
    # Add item
    prods = client.get("/api/v1/products?page_size=1").json()["items"]
    client.post(
        "/api/v1/cart/items",
        json={"product_id": prods[0]["id"], "quantity": 1},
        headers=auth_headers
    )

    # Checkout with simulate_failure: True
    fail_res = client.post(
        "/api/v1/orders/checkout",
        json={
            "shipping_address": "42 Tech Boulevard",
            "shipping_city": "Bengaluru",
            "shipping_postal_code": "560001",
            "simulate_failure": True
        },
        headers=auth_headers
    )
    assert fail_res.status_code == 402
    assert "declined" in fail_res.json()["detail"].lower()
