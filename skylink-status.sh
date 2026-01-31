#!/bin/bash

# Configuration
PID_DIR="/tmp/skylink"
BACKEND_PORT=8080
FRONTEND_PORT=3000

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "📊 SkyLink Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Backend
echo -e "${BLUE}Backend:${NC}"
if [ -f "$PID_DIR/backend.pid" ]; then
  BACKEND_PID=$(cat "$PID_DIR/backend.pid")

  if kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo -e "  Status: ${GREEN}●${NC} Running"
    echo "  PID: $BACKEND_PID"
    echo "  Port: $BACKEND_PORT"
    echo "  URL: http://localhost:$BACKEND_PORT"

    # Check if port is actually listening
    if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1 || nc -z localhost $BACKEND_PORT 2>/dev/null; then
      echo -e "  Port Status: ${GREEN}Listening${NC}"
    else
      echo -e "  Port Status: ${YELLOW}Not listening yet${NC}"
    fi
  else
    echo -e "  Status: ${RED}●${NC} Not running (stale PID file)"
  fi
else
  echo -e "  Status: ${RED}●${NC} Not running"
fi

echo ""

# Check Frontend
echo -e "${BLUE}Frontend:${NC}"
if [ -f "$PID_DIR/frontend.pid" ]; then
  FRONTEND_PID=$(cat "$PID_DIR/frontend.pid")

  if kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo -e "  Status: ${GREEN}●${NC} Running"
    echo "  PID: $FRONTEND_PID"
    echo "  Port: $FRONTEND_PORT"
    echo "  URL: http://localhost:$FRONTEND_PORT"

    # Check if port is actually listening
    if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1 || nc -z localhost $FRONTEND_PORT 2>/dev/null; then
      echo -e "  Port Status: ${GREEN}Listening${NC}"
    else
      echo -e "  Port Status: ${YELLOW}Not listening yet${NC}"
    fi
  else
    echo -e "  Status: ${RED}●${NC} Not running (stale PID file)"
  fi
else
  echo -e "  Status: ${RED}●${NC} Not running"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
