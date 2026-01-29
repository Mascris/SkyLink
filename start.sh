#!/bin/bash

echo "🚀 Starting SkyLink Application..."
echo ""

# Check if backend directory exists
if [ ! -d "/home/mascris/project/JAVA/SkyLink/Backend/SkyLink" ]; then
    echo "❌ Backend directory not found!"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "/home/mascris/project/JAVA/SkyLink/Frontend" ]; then
    echo "❌ Frontend directory not found!"
    exit 1
fi

echo "📦 Starting Backend..."
cd /home/mascris/project/JAVA/SkyLink/Backend/SkyLink

# Start backend in background
./mvnw spring-boot:run > backend.log 2>&1 &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start (this may take 30-60 seconds)..."
sleep 10

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend failed to start. Check backend.log for details."
    exit 1
fi

echo "✅ Backend starting on http://localhost:8080 (PID: $BACKEND_PID)"
echo ""

echo "🎨 Starting Frontend..."
cd /home/mascris/project/JAVA/SkyLink/Frontend

# Start frontend in background
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 5

if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Frontend failed to start. Check frontend.log for details."
    kill $BACKEND_PID
    exit 1
fi

echo "✅ Frontend starting on http://localhost:3000 (PID: $FRONTEND_PID)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 SkyLink is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Backend:  http://localhost:8080"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "To stop both services:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Logs:"
echo "  Backend:  tail -f /home/mascris/project/JAVA/SkyLink/Backend/SkyLink/backend.log"
echo "  Frontend: tail -f /home/mascris/project/JAVA/SkyLink/Frontend/frontend.log"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
