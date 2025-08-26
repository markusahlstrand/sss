#!/bin/bash

echo "🚀 .NET Orders Service - API Examples"
echo "====================================="

# Build the application
echo "Building application..."
dotnet build

# Start the application in background
echo "Starting Orders Service..."
dotnet run &
SERVICE_PID=$!

# Wait for service to be ready
echo "Waiting for service to start..."
sleep 5

# Check if service is running
if curl -s http://localhost:5000/healthz > /dev/null; then
    echo "✅ Service is running!"
else
    echo "❌ Service failed to start"
    kill $SERVICE_PID 2>/dev/null
    exit 1
fi

# Generate test tokens
echo ""
echo "🔐 Generating test JWT tokens..."
dotnet run --project . -- --generate-tokens

# Export tokens for use in examples
echo ""
echo "📡 Testing API endpoints..."

# Test service info endpoint
echo ""
echo "GET / - Service Information:"
curl -s http://localhost:5000/ | jq .

# Test health endpoints
echo ""
echo "GET /healthz - Health Check:"
curl -s http://localhost:5000/healthz | jq .

echo ""
echo "GET /readyz - Readiness Check:"
curl -s http://localhost:5000/readyz | jq .

# Generate tokens for testing
READ_TOKEN=$(dotnet run --project . -- --generate-token --scopes orders.read | grep -o 'eyJ[^"]*')
WRITE_TOKEN=$(dotnet run --project . -- --generate-token --scopes orders.read,orders.write | grep -o 'eyJ[^"]*')

if [ -z "$WRITE_TOKEN" ]; then
    echo "⚠️  Could not generate tokens. Using test API without authentication..."
    
    # Test unauthenticated request (should fail)
    echo ""
    echo "POST /orders - Create Order (without token - should fail):"
    curl -s -X POST http://localhost:5000/orders \
        -H "Content-Type: application/json" \
        -d '{"customerId": "customer-123", "items": ["item-1", "item-2"]}' | jq .
else
    echo "✅ Tokens generated successfully"
    
    # Test authenticated requests
    echo ""
    echo "POST /orders - Create Order:"
    ORDER_RESPONSE=$(curl -s -X POST http://localhost:5000/orders \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $WRITE_TOKEN" \
        -d '{"customerId": "customer-123", "items": ["item-1", "item-2"]}')
    
    echo "$ORDER_RESPONSE" | jq .
    ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.id')
    
    echo ""
    echo "GET /orders/{id} - Get Order:"
    curl -s http://localhost:5000/orders/$ORDER_ID \
        -H "Authorization: Bearer $READ_TOKEN" | jq .
    
    echo ""
    echo "PATCH /orders/{id} - Update Order Status:"
    curl -s -X PATCH http://localhost:5000/orders/$ORDER_ID \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $WRITE_TOKEN" \
        -d '{"status": "paid"}' | jq .
    
    echo ""
    echo "GET /orders - List Orders:"
    curl -s "http://localhost:5000/orders?limit=5&offset=0" \
        -H "Authorization: Bearer $READ_TOKEN" | jq .
fi

# Test OpenAPI endpoint
echo ""
echo "GET /openapi.json - OpenAPI Specification (first 200 chars):"
curl -s http://localhost:5000/openapi.json | jq . | head -c 200
echo "..."

# Test error handling
echo ""
echo "POST /orders - Invalid Request (validation error):"
curl -s -X POST http://localhost:5000/orders \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $WRITE_TOKEN" \
    -d '{"customerId": "", "items": []}' | jq .

echo ""
echo "🎉 All examples completed!"
echo ""
echo "📖 Available endpoints:"
echo "  GET    /                 - Service information"
echo "  GET    /openapi.json     - OpenAPI specification"  
echo "  GET    /healthz          - Health check"
echo "  GET    /readyz           - Readiness check"
echo "  GET    /orders           - List orders"
echo "  POST   /orders           - Create order"
echo "  GET    /orders/{id}      - Get order"
echo "  PATCH  /orders/{id}      - Update order"
echo ""
echo "🔧 Tools:"
echo "  Swagger UI: http://localhost:5000/swagger"
echo "  Jaeger UI:  http://localhost:16686"

# Cleanup
kill $SERVICE_PID 2>/dev/null
echo ""
echo "Service stopped."
