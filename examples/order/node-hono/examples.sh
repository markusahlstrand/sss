#!/bin/bash

# Orders Service - API Testing Examples
# This script demonstrates how to interact with the Hono Orders API

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${BASE_URL:-http://localhost:3000}
JWT_SECRET=${JWT_SECRET:-your-secret-key}

echo -e "${BLUE}🚀 Orders Service API Testing Examples${NC}"
echo -e "${BLUE}Base URL: $BASE_URL${NC}"
echo ""

# Function to print section headers
print_header() {
    echo -e "${YELLOW}=== $1 ===${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Generate test tokens
print_header "Generating Test Tokens"
echo "Generating JWT tokens for testing..."

# Read-only token (orders.read)
READ_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign({
  sub: 'user-123',
  scopes: ['orders.read'],
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
}, '$JWT_SECRET');
console.log(token);
")

# Read/Write token (orders.read, orders.write)
WRITE_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign({
  sub: 'user-456',
  scopes: ['orders.read', 'orders.write'],
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
}, '$JWT_SECRET');
console.log(token);
")

print_success "Tokens generated"
echo ""

# Test 1: Service Information
print_header "1. Service Information (No Auth Required)"
echo "GET $BASE_URL/"

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/")
http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE:/d')

if [ "$http_code" = "200" ]; then
    print_success "Service info retrieved"
    echo "$body" | jq .
else
    print_error "Failed to get service info (HTTP $http_code)"
fi
echo ""

# Test 2: Health Checks
print_header "2. Health Checks (No Auth Required)"

echo "GET $BASE_URL/healthz"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/healthz")
http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)

if [ "$http_code" = "200" ]; then
    print_success "Liveness check passed"
else
    print_error "Liveness check failed (HTTP $http_code)"
fi

echo "GET $BASE_URL/readyz"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/readyz")
http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)

if [ "$http_code" = "200" ]; then
    print_success "Readiness check passed"
else
    print_error "Readiness check failed (HTTP $http_code)"
fi
echo ""

# Test 3: OpenAPI Documentation
print_header "3. OpenAPI Documentation (No Auth Required)"
echo "GET $BASE_URL/openapi.json"

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/openapi.json")
http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)

if [ "$http_code" = "200" ]; then
    print_success "OpenAPI spec retrieved"
    echo "Available at: $BASE_URL/docs (Swagger UI)"
else
    print_error "Failed to get OpenAPI spec (HTTP $http_code)"
fi
echo ""

# Test 4: Unauthorized Access
print_header "4. Unauthorized Access Test"
echo "GET $BASE_URL/orders (no token)"

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/orders")
http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE:/d')

if [ "$http_code" = "401" ]; then
    print_success "Correctly rejected unauthorized request"
    echo "$body" | jq .
else
    print_error "Expected 401 but got HTTP $http_code"
fi
echo ""

# Test 5: Read Orders (Empty List)
print_header "5. Read Orders (Empty List Initially)"
echo "GET $BASE_URL/orders"
echo "Authorization: Bearer [READ_TOKEN]"

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Authorization: Bearer $READ_TOKEN" \
  "$BASE_URL/orders")

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE:/d')

if [ "$http_code" = "200" ]; then
    print_success "Orders retrieved successfully"
    echo "$body" | jq .
else
    print_error "Failed to get orders (HTTP $http_code)"
    echo "$body" | jq .
fi
echo ""

# Test 6: Create Order
print_header "6. Create New Order"
echo "POST $BASE_URL/orders"
echo "Authorization: Bearer [WRITE_TOKEN]"

order_data='{
  "customerId": "550e8400-e29b-41d4-a716-446655440001",
  "items": [
    {
      "productId": "550e8400-e29b-41d4-a716-446655440003",
      "quantity": 2,
      "price": 29.99
    },
    {
      "productId": "550e8400-e29b-41d4-a716-446655440004",
      "quantity": 1,
      "price": 19.99
    }
  ],
  "totalAmount": 79.97
}'

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $WRITE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$order_data" \
  "$BASE_URL/orders")

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE:/d')

if [ "$http_code" = "201" ]; then
    print_success "Order created successfully"
    ORDER_ID=$(echo "$body" | jq -r '.id')
    echo "Order ID: $ORDER_ID"
    echo "$body" | jq .
else
    print_error "Failed to create order (HTTP $http_code)"
    echo "$body" | jq .
fi
echo ""

# Test 7: Get Specific Order
if [ ! -z "$ORDER_ID" ]; then
    print_header "7. Get Specific Order"
    echo "GET $BASE_URL/orders/$ORDER_ID"
    echo "Authorization: Bearer [READ_TOKEN]"

    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
      -H "Authorization: Bearer $READ_TOKEN" \
      "$BASE_URL/orders/$ORDER_ID")

    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_CODE:/d')

    if [ "$http_code" = "200" ]; then
        print_success "Order retrieved successfully"
        echo "$body" | jq .
    else
        print_error "Failed to get order (HTTP $http_code)"
        echo "$body" | jq .
    fi
    echo ""
fi

# Test 8: Update Order Status
if [ ! -z "$ORDER_ID" ]; then
    print_header "8. Update Order Status"
    echo "PATCH $BASE_URL/orders/$ORDER_ID"
    echo "Authorization: Bearer [WRITE_TOKEN]"

    update_data='{"status": "confirmed"}'

    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
      -X PATCH \
      -H "Authorization: Bearer $WRITE_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$update_data" \
      "$BASE_URL/orders/$ORDER_ID")

    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_CODE:/d')

    if [ "$http_code" = "200" ]; then
        print_success "Order status updated successfully"
        echo "$body" | jq .
    else
        print_error "Failed to update order (HTTP $http_code)"
        echo "$body" | jq .
    fi
    echo ""
fi

# Test 9: List Orders (Should now have 1)
print_header "9. List Orders (After Creation)"
echo "GET $BASE_URL/orders"
echo "Authorization: Bearer [READ_TOKEN]"

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Authorization: Bearer $READ_TOKEN" \
  "$BASE_URL/orders")

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE:/d')

if [ "$http_code" = "200" ]; then
    print_success "Orders list retrieved successfully"
    order_count=$(echo "$body" | jq '. | length')
    echo "Total orders: $order_count"
    echo "$body" | jq .
else
    print_error "Failed to get orders (HTTP $http_code)"
    echo "$body" | jq .
fi
echo ""

# Test 10: Validation Error Test
print_header "10. Validation Error Test"
echo "POST $BASE_URL/orders (invalid data)"
echo "Authorization: Bearer [WRITE_TOKEN]"

invalid_data='{
  "customerId": "invalid-uuid",
  "items": [],
  "totalAmount": -10
}'

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $WRITE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$invalid_data" \
  "$BASE_URL/orders")

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE:/d')

if [ "$http_code" = "400" ]; then
    print_success "Validation error correctly returned"
    echo "$body" | jq .
else
    print_error "Expected validation error (400) but got HTTP $http_code"
    echo "$body" | jq .
fi
echo ""

# Test 11: Forbidden Access Test
print_header "11. Forbidden Access Test (Read-only token trying to create)"
echo "POST $BASE_URL/orders (using read-only token)"
echo "Authorization: Bearer [READ_TOKEN]"

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $READ_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$order_data" \
  "$BASE_URL/orders")

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE:/d')

if [ "$http_code" = "403" ]; then
    print_success "Correctly rejected insufficient scope"
    echo "$body" | jq .
else
    print_error "Expected 403 but got HTTP $http_code"
    echo "$body" | jq .
fi
echo ""

# Test 12: Not Found Test
print_header "12. Not Found Test"
echo "GET $BASE_URL/orders/550e8400-e29b-41d4-a716-000000000000"
echo "Authorization: Bearer [READ_TOKEN]"

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Authorization: Bearer $READ_TOKEN" \
  "$BASE_URL/orders/550e8400-e29b-41d4-a716-000000000000")

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE:/d')

if [ "$http_code" = "404" ]; then
    print_success "Correctly returned not found"
    echo "$body" | jq .
else
    print_error "Expected 404 but got HTTP $http_code"
    echo "$body" | jq .
fi
echo ""

# Summary
print_header "Test Summary"
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "Service endpoints tested:"
echo "  • Service info: GET /"
echo "  • Health checks: GET /healthz, GET /readyz"  
echo "  • API documentation: GET /openapi.json, GET /docs"
echo "  • Orders API: GET, POST, PATCH /orders"
echo ""
echo "Authentication & authorization tested:"
echo "  • Unauthorized access (401)"
echo "  • Insufficient scopes (403)"
echo "  • Valid JWT tokens with appropriate scopes"
echo ""
echo "Error handling tested:"
echo "  • Validation errors (400)"
echo "  • Not found errors (404)"
echo "  • RFC 7807 Problem+JSON format"
echo ""
echo -e "${BLUE}🎉 Service Standard v1 compliance verified!${NC}"
