#!/bin/bash

# PII Scanner Start Script with Docker/Native support
NATIVE_MODE=false
DOCKER_PROFILE=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--native)
            NATIVE_MODE=true
            shift
            ;;
        --with-labeling)
            DOCKER_PROFILE="--profile labeling"
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -n, --native       Run in native mode (default: Docker mode)"
            echo "  --with-labeling    Include labeling services (Docker mode only)"
            echo "  -h, --help         Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

if [ "$NATIVE_MODE" = true ]; then
    echo "🚀 Starting PII Scanner in native development mode..."
else
    echo "🐳 Starting PII Scanner in Docker mode..."
fi

# Function to handle cleanup
cleanup() {
    echo "🔄 Shutting down all services..."
    if [ "$NATIVE_MODE" = true ]; then
        ./stop.sh -n
    else
        ./stop.sh
    fi
    exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Docker Mode
if [ "$NATIVE_MODE" = false ]; then
    echo "🐳 Starting services with Docker Compose..."
    
    # Check if Docker and Docker Compose are installed
    if ! command -v docker >/dev/null 2>&1; then
        echo "❌ Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker compose version >/dev/null 2>&1; then
        echo "❌ Docker Compose is not installed or too old. Please install Docker Compose v2."
        exit 1
    fi
    
    # Create logs directory
    mkdir -p logs
    
    echo "🌟 Building and starting all services..."
    echo "   Frontend: http://localhost:3000"
    echo "   Backend: http://localhost:3001"
    echo "   Deep Search: http://localhost:8000"
    echo "   Context Search: http://localhost:8001"
    echo "   Ollama: http://localhost:11434"
    
    if [ -n "$DOCKER_PROFILE" ]; then
        echo "   Labeling Frontend: http://localhost:3002"
        echo "   Labeling Backend: http://localhost:8002"
    fi
    echo ""
    
    # Start services
    docker compose $DOCKER_PROFILE up --build
    exit 0
fi

# Native Mode (existing code with modifications)
echo "🏠 Running in native development mode..."

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
        # Start Ollama service in background
        nohup ollama serve > logs/ollama.log 2>&1 &
        OLLAMA_PID=$!
        echo $OLLAMA_PID > logs/ollama.pid
        echo "🚀 Started Ollama service (PID: $OLLAMA_PID)"
        
        # Wait for Ollama to be ready
        echo "⏳ Waiting for Ollama to be ready..."
        for i in {1..10}; do
            if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
                echo "✅ Ollama started successfully and is ready"
                
                # Check if default model is available
                if ! curl -s http://localhost:11434/api/tags | grep -q "llama3.2:3b"; then
                    echo "📦 Downloading default model (llama3.2:3b)..."
                    ollama pull llama3.2:3b &
                fi
                break
            elif [ $i -eq 10 ]; then
                echo "❌ Failed to start Ollama after 10 attempts. Check logs/ollama.log"
                echo "💡 You may need to start Ollama manually: ollama serve"
            else
                echo "   Attempt $i/10..."
                sleep 2
            fi
        done
    else
        echo "❌ Ollama not installed. Please install it first:"
        echo "   macOS: brew install ollama"
        echo "   Linux: curl -fsSL https://ollama.ai/install.sh | sh"
    fi
else
    echo "✅ Ollama is already running"
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