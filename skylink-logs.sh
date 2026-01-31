#!/bin/bash

# Configuration
PROJECT_ROOT="${SKYLINK_ROOT:-/home/mascris/project/JAVA/SkyLink}"
LOG_DIR="$PROJECT_ROOT/logs"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_usage() {
    echo "Usage: $0 [backend|frontend|both]"
    echo ""
    echo "Options:"
    echo "  backend   - Show backend logs only"
    echo "  frontend  - Show frontend logs only"
    echo "  both      - Show both logs side by side (default)"
    echo ""
    echo "Examples:"
    echo "  $0              # Show both logs"
    echo "  $0 backend      # Show only backend logs"
    echo "  $0 frontend     # Show only frontend logs"
}

if [ ! -d "$LOG_DIR" ]; then
    echo -e "${RED}❌ Log directory not found: $LOG_DIR${NC}"
    exit 1
fi

MODE="${1:-both}"

case "$MODE" in
    backend)
        if [ -f "$LOG_DIR/backend.log" ]; then
            echo -e "${BLUE}📦 Backend Logs (Ctrl+C to exit)${NC}"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            tail -f "$LOG_DIR/backend.log"
        else
            echo -e "${RED}❌ Backend log file not found${NC}"
            exit 1
        fi
        ;;
    frontend)
        if [ -f "$LOG_DIR/frontend.log" ]; then
            echo -e "${BLUE}🎨 Frontend Logs (Ctrl+C to exit)${NC}"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            tail -f "$LOG_DIR/frontend.log"
        else
            echo -e "${RED}❌ Frontend log file not found${NC}"
            exit 1
        fi
        ;;
    both)
        if [ ! -f "$LOG_DIR/backend.log" ] && [ ! -f "$LOG_DIR/frontend.log" ]; then
            echo -e "${RED}❌ No log files found${NC}"
            exit 1
        fi
        
        echo -e "${BLUE}📊 Viewing Both Logs (Ctrl+C to exit)${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        
        # Check if multitail is available
        if command -v multitail >/dev/null 2>&1; then
            multitail -l "tail -f $LOG_DIR/backend.log" -l "tail -f $LOG_DIR/frontend.log"
        else
            # Fallback to simple tail with labels
            (
                [ -f "$LOG_DIR/backend.log" ] && tail -f "$LOG_DIR/backend.log" | sed 's/^/[BACKEND]  /' &
                [ -f "$LOG_DIR/frontend.log" ] && tail -f "$LOG_DIR/frontend.log" | sed 's/^/[FRONTEND] /' &
                wait
            )
        fi
        ;;
    -h|--help)
        show_usage
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid option: $MODE${NC}"
        echo ""
        show_usage
        exit 1
        ;;
esac
