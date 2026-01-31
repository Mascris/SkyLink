#!/bin/bash

# Configuration
PID_DIR="/tmp/skylink"
LOG_DIR="${SKYLINK_ROOT:-/home/mascris/project/JAVA/SkyLink}/logs"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🛑 Stopping SkyLink Application..."
echo ""

STOPPED_ANY=false

# Stop Backend
if [ -f "$PID_DIR/backend.pid" ]; then
  BACKEND_PID=$(cat "$PID_DIR/backend.pid")

  if kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo -e "${YELLOW}Stopping backend (PID: $BACKEND_PID)...${NC}"
    kill "$BACKEND_PID"

    # Wait up to 10 seconds for graceful shutdown
    for i in {1..10}; do
      if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo -e "${GREEN}✅ Backend stopped gracefully${NC}"
        break
      fi
      sleep 1
    done

    # Force kill if still running
    if kill -0 "$BACKEND_PID" 2>/dev/null; then
      echo -e "${YELLOW}Force killing backend...${NC}"
      kill -9 "$BACKEND_PID" 2>/dev/null
      echo -e "${GREEN}✅ Backend force stopped${NC}"
    fi

    STOPPED_ANY=true
  else
    echo -e "${YELLOW}Backend not running${NC}"
  fi

  rm -f "$PID_DIR/backend.pid"
else
  echo -e "${YELLOW}No backend PID file found${NC}"
fi

echo ""

# Stop Frontend
if [ -f "$PID_DIR/frontend.pid" ]; then
  FRONTEND_PID=$(cat "$PID_DIR/frontend.pid")

  if kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo -e "${YELLOW}Stopping frontend (PID: $FRONTEND_PID)...${NC}"
    kill "$FRONTEND_PID"

    # Wait up to 5 seconds for graceful shutdown
    for i in {1..5}; do
      if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo -e "${GREEN}✅ Frontend stopped gracefully${NC}"
        break
      fi
      sleep 1
    done

    # Force kill if still running
    if kill -0 "$FRONTEND_PID" 2>/dev/null; then
      echo -e "${YELLOW}Force killing frontend...${NC}"
      kill -9 "$FRONTEND_PID" 2>/dev/null
      echo -e "${GREEN}✅ Frontend force stopped${NC}"
    fi

    STOPPED_ANY=true
  else
    echo -e "${YELLOW}Frontend not running${NC}"
  fi

  rm -f "$PID_DIR/frontend.pid"
else
  echo -e "${YELLOW}No frontend PID file found${NC}"
fi

echo ""

if [ "$STOPPED_ANY" = true ]; then
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✅ SkyLink stopped successfully${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
else
  echo -e "${YELLOW}No SkyLink services were running${NC}"
fi
