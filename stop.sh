#!/bin/bash

# PII Scanner Development Stop Script
echo "Stopping PII Scanner development servers..."

# Kill processes running on common development ports
echo "Stopping frontend (port 3000)..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "No process running on port 3000"

echo "Stopping backend (port 5000)..."
lsof -ti:5000 | xargs kill -9 2>/dev/null || echo "No process running on port 5000"

# Kill any node processes related to this project
echo "Stopping any remaining node processes..."
pkill -f "react-scripts start" 2>/dev/null || true
pkill -f "nodemon.*server.ts" 2>/dev/null || true
pkill -f "ts-node.*server.ts" 2>/dev/null || true

echo "PII Scanner development servers stopped."