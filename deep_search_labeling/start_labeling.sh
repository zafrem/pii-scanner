#!/bin/bash

echo "🏷️  Starting PII Data Labeling System..."

# Function to handle cleanup
cleanup() {
    echo "🔄 Shutting down labeling system..."
    pkill -f "python.*start.py" 2>/dev/null || true
    pkill -f "react-scripts start" 2>/dev/null || true
    exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Create log directory
mkdir -p logs

# Check and install backend dependencies
echo "🔧 Checking backend dependencies..."
cd backend
if [ ! -d "venv" ]; then
    echo "❌ Backend virtual environment not found. Please run setup.sh first."
    exit 1
fi
source venv/bin/activate
cd ..

# Check and install frontend dependencies
echo "🔧 Checking frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/react-scripts" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install frontend dependencies"
        exit 1
    fi
fi

# Verify react-scripts is properly installed
if ! npm list react-scripts | grep -q "react-scripts@[1-9]"; then
    echo "🔄 Fixing react-scripts installation..."
    npm install react-scripts@5.0.1
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install react-scripts"
        exit 1
    fi
fi
cd ..

echo "🐍 Starting backend (Port 8002)..."
cd backend
source venv/bin/activate
python start.py > ../logs/labeling_backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/labeling_backend.pid
cd ..

# Wait for backend to start
sleep 3

echo "⚛️  Starting frontend (Port 3002)..."
cd frontend
BROWSER=none npm start > ../logs/labeling_frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/labeling_frontend.pid
cd ..

echo ""
echo "🌟 PII Data Labeling System started!"
echo "   Frontend: http://localhost:3002"
echo "   Backend API: http://localhost:8002"
echo "   API Docs: http://localhost:8002/docs"
echo ""
echo "📋 Logs available in logs/ directory"
echo "🛑 Press Ctrl+C to stop all services"
echo ""

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
