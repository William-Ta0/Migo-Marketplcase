#!/bin/bash

# Start development servers for Migo Marketplace

echo "🚀 Starting Migo Marketplace Development Servers..."

# Kill any existing processes on these ports
echo "🧹 Cleaning up existing processes..."
pkill -f "node index.js" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true

sleep 2

# Start backend server
echo "📦 Starting backend server on port 5001..."
cd backend
node index.js &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Check if backend started
if ! lsof -i :5001 >/dev/null 2>&1; then
    echo "❌ Failed to start backend server"
    exit 1
fi

echo "✅ Backend server started successfully"

# Start frontend server with HOST override
echo "🌐 Starting frontend server on port 3000..."
cd frontend
HOST=localhost npm start &
FRONTEND_PID=$!
cd ..

echo "⏳ Waiting for frontend server to start..."
sleep 10

# Check if frontend started
if ! lsof -i :3000 >/dev/null 2>&1; then
    echo "❌ Failed to start frontend server"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Frontend server started successfully"
echo ""
echo "🎉 Both servers are running:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
wait 