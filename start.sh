#!/bin/bash

# PII Scanner Development Start Script
echo "Starting PII Scanner in development mode..."

# Check if node_modules exists in root
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
fi

# Check if backend dependencies exist
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Check if frontend dependencies exist
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Build engines if needed
if [ ! -d "engines/patterns/*.js" ]; then
    echo "Building engines..."
    cd engines && npm run build && cd ..
fi

# Start development servers
echo "Starting development servers..."
npm run dev