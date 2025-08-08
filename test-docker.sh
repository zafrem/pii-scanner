#!/bin/bash

# Simple test script for Docker deployment
echo "🧪 Testing PII Scanner Docker deployment..."

# Function to check service health
check_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Waiting for $service_name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            echo "✅ $service_name is ready"
            return 0
        else
            echo "   Attempt $attempt/$max_attempts..."
            sleep 2
            ((attempt++))
        fi
    done
    
    echo "❌ $service_name failed to start after $max_attempts attempts"
    return 1
}

# Start services in detached mode
echo "🚀 Starting Docker services..."
docker compose up -d --build

# Wait for services to be ready
echo ""
echo "🔍 Checking service health..."

# Check Ollama first (other services depend on it)
if ! check_service "http://localhost:11434/api/tags" "Ollama"; then
    echo "❌ Ollama is not ready. Other services may fail."
fi

# Check AI engines
check_service "http://localhost:8000/health" "Deep Search Engine"
check_service "http://localhost:8001/health" "Context Search Engine"

# Check web services
check_service "http://localhost:3001/api/health" "Backend API"
check_service "http://localhost:3000" "Frontend"

echo ""
echo "🧪 Running basic API tests..."

# Test basic search endpoint
echo "📝 Testing basic search..."
response=$(curl -s -X POST http://localhost:3001/api/search/basic \
    -H "Content-Type: application/json" \
    -d '{
        "text": "My name is John Doe and my email is john@example.com",
        "languages": ["english"],
        "maxCharacters": 10000
    }')

if echo "$response" | grep -q '"success":true'; then
    echo "✅ Basic search API works"
else
    echo "❌ Basic search API failed"
    echo "Response: $response"
fi

# Test deep search endpoint
echo "📊 Testing deep search..."
response=$(curl -s -X POST http://localhost:3001/api/search/deep \
    -H "Content-Type: application/json" \
    -d '{
        "text": "My name is John Doe and my email is john@example.com",
        "languages": ["english"],
        "maxCharacters": 10000
    }')

if echo "$response" | grep -q '"success":true'; then
    echo "✅ Deep search API works"
else
    echo "❌ Deep search API failed"
    echo "Response: $response"
fi

# Test context search endpoint
echo "🤖 Testing context search..."
response=$(curl -s -X POST http://localhost:3001/api/search/context \
    -H "Content-Type: application/json" \
    -d '{
        "text": "My name is John Doe and my email is john@example.com",
        "languages": ["english"],
        "maxCharacters": 10000,
        "previousDetections": []
    }')

if echo "$response" | grep -q '"success":true'; then
    echo "✅ Context search API works"
else
    echo "❌ Context search API failed"
    echo "Response: $response"
fi

echo ""
echo "🎉 Docker deployment test completed!"
echo ""
echo "🌐 Access the application at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend: http://localhost:3001"
echo ""
echo "💡 To stop services: docker compose down"
echo "💡 To view logs: docker compose logs [service-name]"