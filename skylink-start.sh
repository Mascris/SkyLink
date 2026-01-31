#!/bin/bash

# Configuration - Easy to customize
PROJECT_ROOT="${SKYLINK_ROOT:-/home/mascris/project/JAVA/SkyLink}"
BACKEND_DIR="$PROJECT_ROOT/Backend/SkyLink"
FRONTEND_DIR="$PROJECT_ROOT/Frontend"
BACKEND_PORT=8080
FRONTEND_PORT=3000
BACKEND_HEALTH_ENDPOINT="http://localhost:$BACKEND_PORT/actuator/health"
PID_DIR="/tmp/skylink"
LOG_DIR="$PROJECT_ROOT/logs"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create necessary directories
mkdir -p "$PID_DIR" "$LOG_DIR"

# Cleanup function
cleanup() {
  echo ""
  echo -e "${YELLOW}🛑 Shutting down SkyLink...${NC}"

  if [ -f "$PID_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$PID_DIR/backend.pid")
    if kill -0 "$BACKEND_PID" 2>/dev/null; then
      echo "  Stopping backend (PID: $BACKEND_PID)..."
      kill "$BACKEND_PID"
      sleep 2
      # Force kill if still running
      kill -9 "$BACKEND_PID" 2>/dev/null
    fi
    rm -f "$PID_DIR/backend.pid"
  fi

  if [ -f "$PID_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$PID_DIR/frontend.pid")
    if kill -0 "$FRONTEND_PID" 2>/dev/null; then
      echo "  Stopping frontend (PID: $FRONTEND_PID)..."
      kill "$FRONTEND_PID"
      sleep 1
      kill -9 "$FRONTEND_PID" 2>/dev/null
    fi
    rm -f "$PID_DIR/frontend.pid"
  fi

  echo -e "${GREEN}✅ SkyLink stopped${NC}"
  exit 0
}

# Set up trap to catch Ctrl+C and other termination signals
trap cleanup SIGINT SIGTERM EXIT

# Function to check if port is in use
check_port() {
  local port=$1
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 || nc -z localhost $port 2>/dev/null; then
    return 0
  else
    return 1
  fi
}

# Function to wait for backend to be healthy
wait_for_backend() {
  local max_attempts=60
  local attempt=0

  echo -e "${BLUE}⏳ Waiting for backend to be healthy...${NC}"

  while [ $attempt -lt $max_attempts ]; do
    # Check if process is still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
      echo -e "${RED}❌ Backend process died. Check logs:${NC}"
      echo "   tail -f $LOG_DIR/backend.log"
      return 1
    fi

    # Try to curl the health endpoint
    if curl -s -f "$BACKEND_HEALTH_ENDPOINT" >/dev/null 2>&1; then
      echo -e "${GREEN}✅ Backend is healthy!${NC}"
      return 0
    fi

    # Also check if port is listening as fallback
    if check_port $BACKEND_PORT; then
      echo -e "${GREEN}✅ Backend is running on port $BACKEND_PORT${NC}"
      return 0
    fi

    attempt=$((attempt + 1))
    sleep 1
    echo -n "."
  done

  echo ""
  echo -e "${RED}❌ Backend failed to start within 60 seconds${NC}"
  return 1
}

# Function to wait for frontend
wait_for_frontend() {
  local max_attempts=30
  local attempt=0

  echo -e "${BLUE}⏳ Waiting for frontend to start...${NC}"

  while [ $attempt -lt $max_attempts ]; do
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
      echo -e "${RED}❌ Frontend process died. Check logs:${NC}"
      echo "   tail -f $LOG_DIR/frontend.log"
      return 1
    fi

    if check_port $FRONTEND_PORT; then
      echo -e "${GREEN}✅ Frontend is running!${NC}"
      return 0
    fi

    attempt=$((attempt + 1))
    sleep 1
    echo -n "."
  done

  echo ""
  echo -e "${RED}❌ Frontend failed to start within 30 seconds${NC}"
  return 1
}

# Main script starts here
echo "🚀 Starting SkyLink Application..."
echo ""

# Validate directories
if [ ! -d "$BACKEND_DIR" ]; then
  echo -e "${RED}❌ Backend directory not found: $BACKEND_DIR${NC}"
  exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
  echo -e "${RED}❌ Frontend directory not found: $FRONTEND_DIR${NC}"
  exit 1
fi

# Check if already running
if [ -f "$PID_DIR/backend.pid" ] && kill -0 $(cat "$PID_DIR/backend.pid") 2>/dev/null; then
  echo -e "${YELLOW}⚠️  Backend is already running (PID: $(cat "$PID_DIR/backend.pid"))${NC}"
  echo "   Stop it first with: ./skylink-stop.sh"
  exit 1
fi

if [ -f "$PID_DIR/frontend.pid" ] && kill -0 $(cat "$PID_DIR/frontend.pid") 2>/dev/null; then
  echo -e "${YELLOW}⚠️  Frontend is already running (PID: $(cat "$PID_DIR/frontend.pid"))${NC}"
  echo "   Stop it first with: ./skylink-stop.sh"
  exit 1
fi

# Start Backend
echo "📦 Starting Backend..."
cd "$BACKEND_DIR"

if [ ! -f "./mvnw" ]; then
  echo -e "${RED}❌ Maven wrapper not found in $BACKEND_DIR${NC}"
  exit 1
fi

./mvnw spring-boot:run >"$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID >"$PID_DIR/backend.pid"

echo "   PID: $BACKEND_PID"
echo "   Log: $LOG_DIR/backend.log"

# Wait for backend to be healthy
if ! wait_for_backend; then
  echo -e "${RED}❌ Backend startup failed${NC}"
  cleanup
  exit 1
fi

echo ""

# Start Frontend
echo "🎨 Starting Frontend..."
cd "$FRONTEND_DIR"

if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ package.json not found in $FRONTEND_DIR${NC}"
  cleanup
  exit 1
fi

npm run dev >"$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID >"$PID_DIR/frontend.pid"

echo "   PID: $FRONTEND_PID"
echo "   Log: $LOG_DIR/frontend.log"

# Wait for frontend to start
if ! wait_for_frontend; then
  echo -e "${RED}❌ Frontend startup failed${NC}"
  cleanup
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 SkyLink is running!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 Backend:${NC}  http://localhost:$BACKEND_PORT"
echo -e "${BLUE}🌐 Frontend:${NC} http://localhost:$FRONTEND_PORT"
echo ""
echo -e "${YELLOW}📝 Logs:${NC}"
echo "   Backend:  tail -f $LOG_DIR/backend.log"
echo "   Frontend: tail -f $LOG_DIR/frontend.log"
echo ""
echo -e "${YELLOW}🛑 To stop:${NC}"
echo "   Press Ctrl+C or run: ./skylink-stop.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop all services..."

# Keep script running and wait for signal
wait
