#!/bin/bash

# Example API calls for the Orders Service
# Make sure the service is running first (npm run start:dev)

API_BASE="http://localhost:3000"

echo "=== Orders Service API Examples ==="
echo

# Note: In a real environment, you would need a valid JWT token
# For testing purposes, these examples show the expected API structure
# You would need to implement JWT token generation or use a test token

echo "1. Service Information (no authentication required)"
curl -X GET "$API_BASE/" | jq
echo
echo

echo "2. Health Check (no authentication required)"
curl -X GET "$API_BASE/healthz" | jq
echo
echo

echo "3. Readiness Check (no authentication required)"
curl -X GET "$API_BASE/readyz" | jq
echo
echo

echo "4. Create Order (requires JWT token with 'orders.write' scope)"
echo "curl -X POST $API_BASE/orders \\"
echo '  -H "Authorization: Bearer YOUR_JWT_TOKEN" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '\''{"customerId": "customer-123", "items": ["item-1", "item-2"]}'\'''
echo

echo "5. Get Orders (requires JWT token with 'orders.read' scope)"
echo "curl -X GET $API_BASE/orders?limit=10&offset=0 \\"
echo '  -H "Authorization: Bearer YOUR_JWT_TOKEN"'
echo

echo "6. Get Order by ID (requires JWT token with 'orders.read' scope)"
echo "curl -X GET $API_BASE/orders/ORDER_ID \\"
echo '  -H "Authorization: Bearer YOUR_JWT_TOKEN"'
echo

echo "7. Update Order Status (requires JWT token with 'orders.write' scope)"
echo "curl -X PATCH $API_BASE/orders/ORDER_ID \\"
echo '  -H "Authorization: Bearer YOUR_JWT_TOKEN" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '\''{"status": "paid"}'\'''
echo

echo "=== API Documentation ==="
echo "Visit http://localhost:3000/api-docs for Swagger documentation"
echo

echo "=== Service Contracts ==="
echo "- OpenAPI Spec: openapi.yaml"
echo "- AsyncAPI Spec: asyncapi.yaml"
echo "- Service Manifest: service.yaml"
