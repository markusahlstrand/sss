import os
import sys
import pytest
from fastapi.testclient import TestClient
from jose import jwt
from datetime import datetime, timedelta

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from src.main import app

client = TestClient(app)

# Test configuration
JWT_SECRET_KEY = "test-secret-key"
JWT_ALGORITHM = "HS256"

def create_test_token(scopes=None, sub="test-user"):
    """Create a test JWT token."""
    if scopes is None:
        scopes = ["orders.read", "orders.write"]
    
    payload = {
        "sub": sub,
        "scopes": scopes,
        "exp": datetime.utcnow() + timedelta(hours=1),
        "iat": datetime.utcnow()
    }
    
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

@pytest.fixture
def auth_headers():
    """Fixture providing authorization headers."""
    token = create_test_token()
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def read_only_headers():
    """Fixture providing read-only authorization headers."""
    token = create_test_token(scopes=["orders.read"])
    return {"Authorization": f"Bearer {token}"}


class TestServiceEndpoints:
    """Test basic service endpoints."""
    
    def test_service_info(self):
        """Test service information endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "orders"
        assert data["version"] == "1.0.0"
    
    def test_openapi_json(self):
        """Test OpenAPI specification endpoint."""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert data["info"]["title"] == "Orders API"
        assert data["info"]["version"] == "1.0.0"
    
    def test_health_endpoints(self):
        """Test health check endpoints."""
        # Liveness
        response = client.get("/healthz")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        
        # Readiness
        response = client.get("/readyz")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


class TestOrdersAPI:
    """Test orders API endpoints."""
    
    def test_create_order_success(self, auth_headers):
        """Test successful order creation."""
        order_data = {
            "customerId": "customer-123",
            "items": ["item-1", "item-2"]
        }
        
        response = client.post("/orders/", json=order_data, headers=auth_headers)
        assert response.status_code == 201
        
        data = response.json()
        assert "id" in data
        assert data["status"] == "pending"
        assert data["customerId"] == "customer-123"
        assert data["items"] == ["item-1", "item-2"]
    
    def test_create_order_validation_error(self, auth_headers):
        """Test order creation with validation errors."""
        # Empty customerId
        order_data = {
            "customerId": "",
            "items": ["item-1"]
        }
        
        response = client.post("/orders/", json=order_data, headers=auth_headers)
        assert response.status_code == 422
        assert response.headers["content-type"] == "application/problem+json"
        
        data = response.json()
        assert data["type"] == "validation_error"
        assert data["status"] == 422
        assert "customerId" in data["detail"]
    
    def test_create_order_empty_items(self, auth_headers):
        """Test order creation with empty items."""
        order_data = {
            "customerId": "customer-123",
            "items": []
        }
        
        response = client.post("/orders/", json=order_data, headers=auth_headers)
        assert response.status_code == 422
        assert response.headers["content-type"] == "application/problem+json"
        
        data = response.json()
        assert data["type"] == "validation_error"
    
    def test_create_order_unauthorized(self):
        """Test order creation without authorization."""
        order_data = {
            "customerId": "customer-123",
            "items": ["item-1"]
        }
        
        response = client.post("/orders/", json=order_data)
        assert response.status_code == 401
    
    def test_create_order_insufficient_scopes(self, read_only_headers):
        """Test order creation with insufficient scopes."""
        order_data = {
            "customerId": "customer-123", 
            "items": ["item-1"]
        }
        
        response = client.post("/orders/", json=order_data, headers=read_only_headers)
        assert response.status_code == 403
    
    def test_get_order_success(self, auth_headers):
        """Test successful order retrieval."""
        # Create an order first
        order_data = {
            "customerId": "customer-123",
            "items": ["item-1"]
        }
        
        create_response = client.post("/orders/", json=order_data, headers=auth_headers)
        order_id = create_response.json()["id"]
        
        # Get the order
        response = client.get(f"/orders/{order_id}", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == order_id
        assert data["customerId"] == "customer-123"
    
    def test_get_order_not_found(self, auth_headers):
        """Test getting non-existent order."""
        response = client.get("/orders/non-existent-id", headers=auth_headers)
        assert response.status_code == 404
        assert response.headers["content-type"] == "application/problem+json"
        
        data = response.json()
        assert data["type"] == "not_found"
        assert data["status"] == 404
    
    def test_update_order_success(self, auth_headers):
        """Test successful order status update."""
        # Create an order
        order_data = {
            "customerId": "customer-123",
            "items": ["item-1"]
        }
        
        create_response = client.post("/orders/", json=order_data, headers=auth_headers)
        order_id = create_response.json()["id"]
        
        # Update the order status
        update_data = {"status": "paid"}
        response = client.patch(f"/orders/{order_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "paid"
    
    def test_update_order_invalid_transition(self, auth_headers):
        """Test invalid status transition."""
        # Create an order
        order_data = {
            "customerId": "customer-123", 
            "items": ["item-1"]
        }
        
        create_response = client.post("/orders/", json=order_data, headers=auth_headers)
        order_id = create_response.json()["id"]
        
        # Try invalid transition (pending -> delivered)
        update_data = {"status": "delivered"}
        response = client.patch(f"/orders/{order_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 409
        assert response.headers["content-type"] == "application/problem+json"
        
        data = response.json()
        assert data["type"] == "conflict"
    
    def test_list_orders_success(self, auth_headers):
        """Test successful order listing."""
        # Create a couple of orders
        for i in range(3):
            order_data = {
                "customerId": f"customer-{i}",
                "items": [f"item-{i}"]
            }
            client.post("/orders/", json=order_data, headers=auth_headers)
        
        # List orders
        response = client.get("/orders/", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "limit" in data
        assert "offset" in data
        assert len(data["items"]) >= 3
    
    def test_list_orders_pagination(self, auth_headers):
        """Test order listing with pagination."""
        response = client.get("/orders/?limit=2&offset=1", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["limit"] == 2
        assert data["offset"] == 1
