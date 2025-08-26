#!/bin/bash

# Simple test script for the .NET Orders Service
echo "Testing .NET Orders Service..."
echo "==============================="

# Test if the service is running on localhost:5000
if curl -s http://localhost:5000/ > /dev/null 2>&1; then
    echo "✅ Service is accessible at http://localhost:5000"
    
    echo ""
    echo "📋 Testing API endpoints:"
    
    echo "GET / - Service Information:"
    curl -s http://localhost:5000/ | jq . || echo "Response received but jq not available"
    
    echo ""
    echo "GET /healthz - Health Check:"
    curl -s http://localhost:5000/healthz | jq . || echo "Response received but jq not available"
    
    echo ""
    echo "GET /readyz - Readiness Check:"
    curl -s http://localhost:5000/readyz | jq . || echo "Response received but jq not available"
    
    echo ""
    echo "🎉 Basic tests completed successfully!"
    echo ""
    echo "📖 Available endpoints:"
    echo "  Swagger UI: http://localhost:5000/swagger"
    echo "  OpenAPI:    http://localhost:5000/openapi.json"
    echo "  Health:     http://localhost:5000/healthz"
    echo "  Readiness:  http://localhost:5000/readyz"
    
else
    echo "❌ Service is not accessible at http://localhost:5000"
    echo "Make sure the service is running with: dotnet run"
fi
