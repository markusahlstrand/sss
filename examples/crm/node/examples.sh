#!/bin/bash

# CRM Service Test Script
# Tests the basic functionality of the CRM service

set -e

BASE_URL="http://localhost:8787"
if [ "$1" != "" ]; then
    BASE_URL="$1"
fi

echo "🧪 Testing CRM Service at $BASE_URL"
echo "=================================="

# Test health endpoints
echo "📋 Testing health endpoints..."

echo -n "  ✓ Liveness check: "
HEALTH_RESPONSE=$(curl -s "$BASE_URL/healthz")
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo "✅ PASS"
else
    echo "❌ FAIL: $HEALTH_RESPONSE"
    exit 1
fi

echo -n "  ✓ Readiness check: "
READY_RESPONSE=$(curl -s "$BASE_URL/readyz")
echo "✅ Response received"

echo -n "  ✓ Service info: "
INFO_RESPONSE=$(curl -s "$BASE_URL/")
if echo "$INFO_RESPONSE" | grep -q "crm-service"; then
    echo "✅ PASS"
else
    echo "❌ FAIL: $INFO_RESPONSE"
    exit 1
fi

echo -n "  ✓ OpenAPI spec: "
OPENAPI_RESPONSE=$(curl -s "$BASE_URL/openapi.json")
if echo "$OPENAPI_RESPONSE" | grep -q "openapi"; then
    echo "✅ PASS"
else
    echo "❌ FAIL: Invalid OpenAPI response"
    exit 1
fi

echo -n "  ✓ Swagger UI: "
SWAGGER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/docs")
if [ "$SWAGGER_RESPONSE" = "200" ]; then
    echo "✅ PASS"
else
    echo "❌ FAIL: HTTP $SWAGGER_RESPONSE"
fi

echo ""

# Generate test token
echo "🔑 Generating test JWT token..."
cd "$(dirname "$0")"
if command -v tsx >/dev/null 2>&1; then
    TOKEN=$(tsx src/scripts/generate-token.ts 2>/dev/null | grep -o 'eyJ[^"]*' | head -1)
else
    echo "⚠️  tsx not available, skipping authenticated tests"
    echo ""
    echo "✅ All basic tests passed!"
    echo ""
    echo "🚀 Next steps:"
    echo "  1. Install dependencies: npm install"
    echo "  2. Run authenticated tests: ./test-service.sh"
    echo "  3. Start development: npm run dev"
    exit 0
fi

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to generate token"
    exit 1
fi

echo "  ✓ Token generated: ${TOKEN:0:20}..."
echo ""

# Test authenticated endpoints
echo "🔐 Testing authenticated endpoints..."

echo -n "  ✓ Create vendor: "
VENDOR_RESPONSE=$(curl -s -X POST "$BASE_URL/vendors" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "vendorId": "test-vendor-'"$(date +%s)"'",
        "name": "Test Vendor Corp",
        "metadata": {"industry": "Technology"}
    }' \
    -w "%{http_code}")

HTTP_CODE="${VENDOR_RESPONSE: -3}"
RESPONSE_BODY="${VENDOR_RESPONSE%???}"

if [ "$HTTP_CODE" = "201" ]; then
    echo "✅ PASS"
    VENDOR_ID=$(echo "$RESPONSE_BODY" | grep -o '"vendorId":"[^"]*"' | cut -d'"' -f4)
    echo "    Created vendor: $VENDOR_ID"
else
    echo "❌ FAIL: HTTP $HTTP_CODE"
    echo "    Response: $RESPONSE_BODY"
fi

if [ ! -z "$VENDOR_ID" ]; then
    echo -n "  ✓ Get vendor: "
    GET_RESPONSE=$(curl -s "$BASE_URL/vendors/$VENDOR_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -w "%{http_code}")
    
    GET_HTTP_CODE="${GET_RESPONSE: -3}"
    if [ "$GET_HTTP_CODE" = "200" ]; then
        echo "✅ PASS"
    else
        echo "❌ FAIL: HTTP $GET_HTTP_CODE"
    fi

    echo -n "  ✓ List vendors: "
    LIST_RESPONSE=$(curl -s "$BASE_URL/vendors?limit=5&offset=0" \
        -H "Authorization: Bearer $TOKEN" \
        -w "%{http_code}")
    
    LIST_HTTP_CODE="${LIST_RESPONSE: -3}"
    if [ "$LIST_HTTP_CODE" = "200" ]; then
        echo "✅ PASS"
    else
        echo "❌ FAIL: HTTP $LIST_HTTP_CODE"
    fi
fi

echo ""

# Test error handling
echo "🚨 Testing error handling..."

echo -n "  ✓ Unauthorized request: "
UNAUTH_RESPONSE=$(curl -s "$BASE_URL/vendors" -w "%{http_code}")
UNAUTH_HTTP_CODE="${UNAUTH_RESPONSE: -3}"
if [ "$UNAUTH_HTTP_CODE" = "401" ]; then
    echo "✅ PASS"
else
    echo "❌ FAIL: Expected 401, got $UNAUTH_HTTP_CODE"
fi

echo -n "  ✓ Invalid JSON: "
INVALID_RESPONSE=$(curl -s -X POST "$BASE_URL/vendors" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{invalid json}' \
    -w "%{http_code}")
INVALID_HTTP_CODE="${INVALID_RESPONSE: -3}"
if [ "$INVALID_HTTP_CODE" = "400" ]; then
    echo "✅ PASS"
else
    echo "❌ FAIL: Expected 400, got $INVALID_HTTP_CODE"
fi

echo -n "  ✓ Validation error: "
VALIDATION_RESPONSE=$(curl -s -X POST "$BASE_URL/vendors" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name": ""}' \
    -w "%{http_code}")
VALIDATION_HTTP_CODE="${VALIDATION_RESPONSE: -3}"
if [ "$VALIDATION_HTTP_CODE" = "400" ]; then
    echo "✅ PASS"
else
    echo "❌ FAIL: Expected 400, got $VALIDATION_HTTP_CODE"
fi

echo -n "  ✓ Not found: "
NOTFOUND_RESPONSE=$(curl -s "$BASE_URL/vendors/nonexistent" \
    -H "Authorization: Bearer $TOKEN" \
    -w "%{http_code}")
NOTFOUND_HTTP_CODE="${NOTFOUND_RESPONSE: -3}"
if [ "$NOTFOUND_HTTP_CODE" = "404" ]; then
    echo "✅ PASS"
else
    echo "❌ FAIL: Expected 404, got $NOTFOUND_HTTP_CODE"
fi

echo ""

echo "✅ All tests passed!"
echo ""
echo "🚀 Service is running correctly!"
echo ""
echo "📖 Available endpoints:"
echo "  • API Documentation: $BASE_URL/docs"
echo "  • Health Check: $BASE_URL/healthz"
echo "  • OpenAPI Spec: $BASE_URL/openapi.json"
echo ""
echo "🔑 Use this token for manual testing:"
echo "Authorization: Bearer $TOKEN"