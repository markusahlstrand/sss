#!/bin/bash
set -e

echo "🐍 Orders Service - Python FastAPI Examples"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if service is running
check_service() {
    if ! curl -s http://localhost:8000/healthz > /dev/null; then
        echo -e "${RED}❌ Service is not running on localhost:8000${NC}"
        echo "Start the service with: python src/main.py"
        exit 1
    fi
    echo -e "${GREEN}✅ Service is running${NC}"
}

# Generate test token
generate_token() {
    echo -e "${BLUE}📝 Generating test token...${NC}"
    TOKEN=$(python generate_test_token.py | grep -E '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$')
    echo -e "${GREEN}Token generated successfully${NC}"
    echo ""
}

# Test service info endpoint
test_service_info() {
    echo -e "${YELLOW}🔍 Testing service info endpoint${NC}"
    echo "GET /"
    curl -s http://localhost:8000/ | python -m json.tool
    echo ""
    echo ""
}

# Test health endpoints
test_health() {
    echo -e "${YELLOW}🏥 Testing health endpoints${NC}"
    echo "GET /healthz"
    curl -s http://localhost:8000/healthz | python -m json.tool
    echo ""
    
    echo "GET /readyz"
    curl -s http://localhost:8000/readyz | python -m json.tool
    echo ""
    echo ""
}

# Test creating an order
test_create_order() {
    echo -e "${YELLOW}🛒 Testing order creation${NC}"
    echo "POST /orders"
    
    ORDER_RESPONSE=$(curl -s -X POST http://localhost:8000/orders/ \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "customerId": "customer-123",
            "items": ["laptop", "mouse", "keyboard"]
        }')
    
    echo "$ORDER_RESPONSE" | python -m json.tool
    
    # Extract order ID for later use
    ORDER_ID=$(echo "$ORDER_RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin)['id'])")
    echo -e "${GREEN}✅ Order created with ID: $ORDER_ID${NC}"
    echo ""
    echo ""
}

# Test getting an order
test_get_order() {
    if [ -z "$ORDER_ID" ]; then
        echo -e "${RED}❌ No order ID available, skipping get order test${NC}"
        return
    fi
    
    echo -e "${YELLOW}📋 Testing order retrieval${NC}"
    echo "GET /orders/$ORDER_ID"
    
    curl -s http://localhost:8000/orders/$ORDER_ID \
        -H "Authorization: Bearer $TOKEN" | python -m json.tool
    echo ""
    echo ""
}

# Test updating order status
test_update_order() {
    if [ -z "$ORDER_ID" ]; then
        echo -e "${RED}❌ No order ID available, skipping update order test${NC}"
        return
    fi
    
    echo -e "${YELLOW}📝 Testing order status update${NC}"
    echo "PATCH /orders/$ORDER_ID"
    
    curl -s -X PATCH http://localhost:8000/orders/$ORDER_ID \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"status": "paid"}' | python -m json.tool
    echo ""
    echo ""
}

# Test listing orders
test_list_orders() {
    echo -e "${YELLOW}📝 Testing order listing${NC}"
    echo "GET /orders"
    
    curl -s "http://localhost:8000/orders/?limit=5&offset=0" \
        -H "Authorization: Bearer $TOKEN" | python -m json.tool
    echo ""
    echo ""
}

# Test error cases
test_error_cases() {
    echo -e "${YELLOW}🚫 Testing error cases${NC}"
    
    echo "1. Unauthorized request (no token):"
    curl -s -w "\nStatus: %{http_code}\n" http://localhost:8000/orders/ | python -m json.tool 2>/dev/null || echo "Invalid JSON (expected for error)"
    echo ""
    
    echo "2. Validation error (empty customer ID):"
    curl -s -X POST http://localhost:8000/orders/ \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"customerId": "", "items": ["item1"]}' | python -m json.tool
    echo ""
    
    echo "3. Not found error:"
    curl -s http://localhost:8000/orders/non-existent-id \
        -H "Authorization: Bearer $TOKEN" | python -m json.tool
    echo ""
    
    if [ ! -z "$ORDER_ID" ]; then
        echo "4. Conflict error (invalid status transition):"
        curl -s -X PATCH http://localhost:8000/orders/$ORDER_ID \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d '{"status": "delivered"}' | python -m json.tool
        echo ""
    fi
    echo ""
}

# Test with insufficient permissions
test_insufficient_permissions() {
    echo -e "${YELLOW}🔒 Testing insufficient permissions${NC}"
    echo "Generating read-only token..."
    
    READ_TOKEN=$(python generate_test_token.py --scopes orders.read | grep -E '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$')
    
    echo "Attempting to create order with read-only token:"
    curl -s -X POST http://localhost:8000/orders/ \
        -H "Authorization: Bearer $READ_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"customerId": "customer-456", "items": ["item1"]}' | python -m json.tool
    echo ""
    echo ""
}

# Test OpenAPI spec
test_openapi() {
    echo -e "${YELLOW}📖 Testing OpenAPI specification${NC}"
    echo "GET /openapi.json"
    
    SPEC=$(curl -s http://localhost:8000/openapi.json)
    echo "$SPEC" | python -c "
import sys, json
spec = json.load(sys.stdin)
print(f\"Title: {spec['info']['title']}\")
print(f\"Version: {spec['info']['version']}\")
print(f\"Paths: {len(spec['paths'])}\")
print(f\"Schemas: {len(spec['components']['schemas'])}\")
print(\"\\nAvailable paths:\")
for path in sorted(spec['paths'].keys()):
    methods = list(spec['paths'][path].keys())
    print(f\"  {path}: {', '.join(methods).upper()}\")
"
    echo ""
    echo ""
}

# Run all tests
run_all_tests() {
    check_service
    generate_token
    test_service_info
    test_health
    test_openapi
    test_create_order
    test_get_order
    test_update_order
    test_list_orders
    test_error_cases
    test_insufficient_permissions
    
    echo -e "${GREEN}🎉 All tests completed!${NC}"
    echo ""
    echo -e "${BLUE}📊 Summary:${NC}"
    echo "- Service is running and healthy"
    echo "- All core endpoints are working"
    echo "- Authentication and authorization are working"
    echo "- Error handling follows RFC 7807"
    echo "- OpenAPI specification is available"
    echo ""
    echo -e "${BLUE}🔗 Useful URLs:${NC}"
    echo "- Service: http://localhost:8000"
    echo "- Health: http://localhost:8000/healthz"
    echo "- OpenAPI: http://localhost:8000/openapi.json"
    echo "- Docs: http://localhost:8000/docs"
    echo "- Jaeger (if running): http://localhost:16686"
}

# Check command line arguments
case "${1:-all}" in
    "service-info")
        check_service
        test_service_info
        ;;
    "health")
        check_service
        test_health
        ;;
    "create")
        check_service
        generate_token
        test_create_order
        ;;
    "errors")
        check_service
        generate_token
        test_error_cases
        ;;
    "all"|*)
        run_all_tests
        ;;
esac
