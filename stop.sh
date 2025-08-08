#!/bin/bash

# PII Scanner Stop Script with Docker/Native support
NATIVE_MODE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--native)
            NATIVE_MODE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -n, --native       Stop native mode services (default: Docker mode)"
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
    echo "🛑 Stopping native PII Scanner services..."
else
    echo "🛑 Stopping Docker PII Scanner services..."
fi

# Docker Mode
if [ "$NATIVE_MODE" = false ]; then
    echo "🐳 Stopping Docker services..."
    
    if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
        # Stop all services including labeling profile
        docker compose --profile labeling down --remove-orphans
        
        # Also clean up any orphaned containers
        echo "🧹 Cleaning up Docker resources..."
        docker system prune -f --volumes 2>/dev/null || true
        
        echo "✅ All Docker services stopped successfully!"
    else
        echo "❌ Docker or Docker Compose not found. Cannot stop Docker services."
    fi
    exit 0
fi

# Native Mode
echo "🏠 Stopping native services..."

# Function to kill process by PID file
kill_by_pid_file() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "🔄 Stopping $service_name (PID: $pid)..."
            kill -TERM "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null
            # Wait a moment for graceful shutdown
            sleep 1
            if kill -0 "$pid" 2>/dev/null; then
                echo "⚠️  Force killing $service_name (PID: $pid)..."
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
        rm -f "$pid_file"
    fi
}

# Stop AI engines first using PID files
echo "🤖 Stopping AI engines..."
kill_by_pid_file "logs/deep_search.pid" "Deep Search Engine"
kill_by_pid_file "logs/context_search.pid" "Context Search Engine"
kill_by_pid_file "logs/ollama.pid" "Ollama Service"

# Kill processes running on all service ports
echo "🌐 Stopping web services..."

echo "   Stopping frontend (port 3000)..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "   No process on port 3000"

echo "   Stopping backend (port 3001)..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "   No process on port 3001"

echo "   Stopping Deep Search Engine (port 8000)..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || echo "   No process on port 8000"

echo "   Stopping Context Search Engine (port 8001)..."
lsof -ti:8001 | xargs kill -9 2>/dev/null || echo "   No process on port 8001"

echo "   Stopping Ollama service (port 11434)..."
lsof -ti:11434 | xargs kill -9 2>/dev/null || echo "   No process on port 11434"

# Clean up any remaining Node.js processes
echo "🧹 Cleaning up Node.js processes..."
pkill -f "react-scripts start" 2>/dev/null || true
pkill -f "nodemon.*server.ts" 2>/dev/null || true
pkill -f "ts-node.*server.ts" 2>/dev/null || true
pkill -f "concurrently" 2>/dev/null || true

# Clean up Python processes related to our engines
echo "🐍 Cleaning up Python processes..."
pkill -f "python.*start.py" 2>/dev/null || true
pkill -f "uvicorn.*api:app" 2>/dev/null || true
pkill -f "deep_search" 2>/dev/null || true
pkill -f "context_search" 2>/dev/null || true

# Stop Ollama service processes
echo "🤖 Stopping Ollama processes..."
pkill -f "ollama serve" 2>/dev/null || echo "   No Ollama serve processes found"
pkill -f "ollama" 2>/dev/null || true

# Clean up PID files
echo "🗑️  Cleaning up PID files..."
rm -f logs/start.pid logs/deep_search.pid logs/context_search.pid logs/ollama.pid

# Give processes a moment to clean up
sleep 1

echo ""
echo "✅ All PII Scanner services stopped successfully!"
echo "📋 Logs preserved in logs/ directory for debugging"
echo ""