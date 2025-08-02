#!/bin/bash

# PII Scanner Development Stop Script
echo "🛑 Stopping all PII Scanner services..."

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

# Optional: Stop Ollama if it was started by our script
# Uncomment the next lines if you want to stop Ollama as well
# echo "🤖 Stopping Ollama (optional)..."
# pkill -f "ollama serve" 2>/dev/null || true

# Clean up PID files
echo "🗑️  Cleaning up PID files..."
rm -f logs/start.pid logs/deep_search.pid logs/context_search.pid

# Give processes a moment to clean up
sleep 1

echo ""
echo "✅ All PII Scanner services stopped successfully!"
echo "📋 Logs preserved in logs/ directory for debugging"
echo ""