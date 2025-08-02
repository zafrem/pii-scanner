#!/bin/bash

# PII Scanner Development Start Script
echo "🚀 Starting PII Scanner in development mode..."

# Function to handle cleanup
cleanup() {
    echo "🔄 Shutting down all services..."
    ./stop.sh
    exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Check if node_modules exists in root
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

# Check if backend dependencies exist
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Check if frontend dependencies exist
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Check Deep Search Engine setup
echo "🧠 Checking Deep Search Engine..."
if [ ! -d "deep_search_engine/venv" ]; then
    echo "⚠️  Deep Search Engine not set up. Please run: cd deep_search_engine && ./setup.sh"
    echo "🔧 Attempting to set up Deep Search Engine..."
    cd deep_search_engine && ./setup.sh && cd ..
fi

# Check Context Search Engine setup  
echo "🤖 Checking Context Search Engine..."
if [ ! -d "context_search_engine/venv" ]; then
    echo "⚠️  Context Search Engine not set up. Installing dependencies..."
    cd context_search_engine
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cp .env.example .env 2>/dev/null || true
    cd ..
fi

# Check if Ollama is running
echo "🔍 Checking Ollama service..."
if ! curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "⚠️  Ollama is not running. Please start Ollama:"
    echo "   brew install ollama (if not installed)"
    echo "   ollama serve &"
    echo "   ollama pull llama3.2:3b"
    echo ""
    echo "🔧 Attempting to start Ollama..."
    if command -v ollama >/dev/null 2>&1; then
        ollama serve &
        sleep 3
        if ! curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
            echo "❌ Failed to start Ollama. Please start it manually."
        else
            echo "✅ Ollama started successfully"
        fi
    else
        echo "❌ Ollama not installed. Please install it first."
    fi
fi

# Check if engines are built (engines already have compiled .js files)
if [ ! -f "engines/patterns/index.js" ]; then
    echo "⚠️  Warning: Engine files may not be built properly"
fi

# Create log directory
mkdir -p logs

# Store PIDs for cleanup
echo $$ > logs/start.pid

echo ""
echo "🌟 Starting all PII Scanner services..."
echo "   Frontend: http://localhost:3000"
echo "   Backend: http://localhost:3001"  
echo "   Deep Search: http://localhost:8000"
echo "   Context Search: http://localhost:8001"
echo "   Ollama: http://localhost:11434"
echo ""

# Start Deep Search Engine
echo "🧠 Starting Deep Search Engine (Port 8000)..."
cd deep_search_engine
source venv/bin/activate
python start.py > ../logs/deep_search.log 2>&1 &
DEEP_SEARCH_PID=$!
echo $DEEP_SEARCH_PID > ../logs/deep_search.pid
cd ..

# Wait a moment for Deep Search to start
sleep 2

# Start Context Search Engine
echo "🤖 Starting Context Search Engine (Port 8001)..."
cd context_search_engine
source venv/bin/activate
python start.py > ../logs/context_search.log 2>&1 &
CONTEXT_SEARCH_PID=$!
echo $CONTEXT_SEARCH_PID > ../logs/context_search.pid
cd ..

# Wait a moment for Context Search to start
sleep 2

# Health check for AI engines
echo "🔍 Performing health checks..."
for i in {1..5}; do
    if curl -s http://localhost:8000/health >/dev/null 2>&1; then
        echo "✅ Deep Search Engine is healthy"
        break
    elif [ $i -eq 5 ]; then
        echo "❌ Deep Search Engine health check failed"
        echo "📋 Check logs: tail -f logs/deep_search.log"
    else
        echo "⏳ Waiting for Deep Search Engine... ($i/5)"
        sleep 2
    fi
done

for i in {1..5}; do
    if curl -s http://localhost:8001/health >/dev/null 2>&1; then
        echo "✅ Context Search Engine is healthy"
        break
    elif [ $i -eq 5 ]; then
        echo "❌ Context Search Engine health check failed"
        echo "📋 Check logs: tail -f logs/context_search.log"
    else
        echo "⏳ Waiting for Context Search Engine... ($i/5)"
        sleep 2
    fi
done

# Start main development servers (frontend + backend)
echo ""
echo "🌐 Starting main development servers..."
echo "📋 Logs available in logs/ directory"
echo "🛑 Press Ctrl+C to stop all services"
echo ""

npm run dev