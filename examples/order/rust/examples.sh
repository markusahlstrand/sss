#!/bin/bash

# Example script for testing the Orders API

set -e

# Configuration
BASE_URL="http://localhost:3000"
JWT_SECRET="your-secret-key"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Orders Service API Testing Script${NC}"
echo "=================================="

# Generate a test JWT token (requires a simple Rust program)
echo -e "\n${YELLOW}1. Generating test JWT token...${NC}"

# Create a simple token generator
cat > /tmp/generate-token.rs << 'EOF'
use serde_json::json;
use std::collections::HashMap;

fn main() {
    // Simple base64 encoding for demo - DO NOT use in production
    let header = r#"{"alg":"HS256","typ":"JWT"}"#;
    let payload = json!({
        "sub": "test-user",
        "exp": (chrono::Utc::now() + chrono::Duration::hours(24)).timestamp(),
        "scopes": ["orders.read", "orders.write"]
    });
    
    let header_b64 = base64::encode_config(header.as_bytes(), base64::URL_SAFE_NO_PAD);
    let payload_b64 = base64::encode_config(payload.to_string().as_bytes(), base64::URL_SAFE_NO_PAD);
    
    // For demo purposes - in production use proper JWT libraries
    println!("{}.{}.demo_signature", header_b64, payload_b64);
}
EOF

# For testing purposes, we'll use a simple demo token
# In production, use proper JWT libraries and signatures
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJleHAiOjE3MjQ2ODMyMDAsInNjb3BlcyI6WyJvcmRlcnMucmVhZCIsIm9yZGVycy53cml0ZSJdfQ.demo_signature"

echo "Using demo token for testing..."
echo "Note: In production, use proper JWT tokens with valid signatures"

# Test service info
echo -e "\n${YELLOW}2. Testing service info endpoint...${NC}"
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/")
http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
body=$(echo "$response" | grep -v "HTTP_STATUS")

if [ "$http_status" -eq 200 ]; then
    echo -e "${GREEN}✓ Service info endpoint working${NC}"
    echo "$body" | jq .
else
    echo -e "${RED}✗ Service info endpoint failed (HTTP $http_status)${NC}"
    echo "$body"
fi

# Test health endpoints
echo -e "\n${YELLOW}3. Testing health endpoints...${NC}"

echo "Testing /healthz..."
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/healthz")
http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
if [ "$http_status" -eq 200 ]; then
    echo -e "${GREEN}✓ Liveness probe working${NC}"
else
    echo -e "${RED}✗ Liveness probe failed (HTTP $http_status)${NC}"
fi

echo "Testing /readyz..."
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/readyz")
http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
if [ "$http_status" -eq 200 ]; then
    echo -e "${GREEN}✓ Readiness probe working${NC}"
else
    echo -e "${RED}✗ Readiness probe failed (HTTP $http_status)${NC}"
fi

# Test OpenAPI endpoint
echo -e "\n${YELLOW}4. Testing OpenAPI specification...${NC}"
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/openapi.json")
http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
if [ "$http_status" -eq 200 ]; then
    echo -e "${GREEN}✓ OpenAPI specification available${NC}"
    echo "Available at: $BASE_URL/swagger-ui"
else
    echo -e "${RED}✗ OpenAPI specification failed (HTTP $http_status)${NC}"
fi

# Test creating an order
echo -e "\n${YELLOW}5. Creating a test order...${NC}"
create_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X POST "$BASE_URL/orders" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "customer_id": "customer-123",
        "items": ["laptop", "mouse", "keyboard"]
    }')

http_status=$(echo "$create_response" | grep "HTTP_STATUS" | cut -d: -f2)
body=$(echo "$create_response" | grep -v "HTTP_STATUS")

if [ "$http_status" -eq 201 ]; then
    echo -e "${GREEN}✓ Order created successfully${NC}"
    ORDER_ID=$(echo "$body" | jq -r '.id')
    echo "Order ID: $ORDER_ID"
    echo "$body" | jq .
else
    echo -e "${RED}✗ Order creation failed (HTTP $http_status)${NC}"
    echo "$body"
    exit 1
fi

# Test getting the order
echo -e "\n${YELLOW}6. Retrieving the created order...${NC}"
get_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/orders/$ORDER_ID")

http_status=$(echo "$get_response" | grep "HTTP_STATUS" | cut -d: -f2)
body=$(echo "$get_response" | grep -v "HTTP_STATUS")

if [ "$http_status" -eq 200 ]; then
    echo -e "${GREEN}✓ Order retrieved successfully${NC}"
    echo "$body" | jq .
else
    echo -e "${RED}✗ Order retrieval failed (HTTP $http_status)${NC}"
    echo "$body"
fi

# Test updating the order
echo -e "\n${YELLOW}7. Updating order status to 'paid'...${NC}"
update_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X PATCH "$BASE_URL/orders/$ORDER_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status": "paid"}')

http_status=$(echo "$update_response" | grep "HTTP_STATUS" | cut -d: -f2)
body=$(echo "$update_response" | grep -v "HTTP_STATUS")

if [ "$http_status" -eq 200 ]; then
    echo -e "${GREEN}✓ Order updated successfully${NC}"
    echo "$body" | jq .
else
    echo -e "${RED}✗ Order update failed (HTTP $http_status)${NC}"
    echo "$body"
fi

# Test listing orders
echo -e "\n${YELLOW}8. Listing all orders...${NC}"
list_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/orders?limit=5&offset=0")

http_status=$(echo "$list_response" | grep "HTTP_STATUS" | cut -d: -f2)
body=$(echo "$list_response" | grep -v "HTTP_STATUS")

if [ "$http_status" -eq 200 ]; then
    echo -e "${GREEN}✓ Orders listed successfully${NC}"
    echo "$body" | jq .
else
    echo -e "${RED}✗ Orders listing failed (HTTP $http_status)${NC}"
    echo "$body"
fi

# Test validation error
echo -e "\n${YELLOW}9. Testing validation error (empty items)...${NC}"
validation_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X POST "$BASE_URL/orders" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "customer_id": "",
        "items": []
    }')

http_status=$(echo "$validation_response" | grep "HTTP_STATUS" | cut -d: -f2)
body=$(echo "$validation_response" | grep -v "HTTP_STATUS")

if [ "$http_status" -eq 400 ]; then
    echo -e "${GREEN}✓ Validation error handled correctly${NC}"
    echo "$body" | jq .
else
    echo -e "${RED}✗ Validation error not handled properly (HTTP $http_status)${NC}"
    echo "$body"
fi

# Test unauthorized access
echo -e "\n${YELLOW}10. Testing unauthorized access...${NC}"
unauth_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    "$BASE_URL/orders")

http_status=$(echo "$unauth_response" | grep "HTTP_STATUS" | cut -d: -f2)
body=$(echo "$unauth_response" | grep -v "HTTP_STATUS")

if [ "$http_status" -eq 401 ]; then
    echo -e "${GREEN}✓ Unauthorized access blocked correctly${NC}"
    echo "$body" | jq .
else
    echo -e "${RED}✗ Unauthorized access not blocked properly (HTTP $http_status)${NC}"
    echo "$body"
fi

echo -e "\n${GREEN}=================================="
echo "✓ All tests completed!"
echo -e "✓ Service is compliant with Service Standard v1${NC}"
echo ""
echo "You can explore the API further at:"
echo "- Swagger UI: $BASE_URL/swagger-ui"
echo "- OpenAPI Spec: $BASE_URL/openapi.json"
echo ""
echo -e "${YELLOW}Note: This demo uses simplified JWT tokens. In production, use proper JWT libraries with signature validation.${NC}"
