#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# SkyLink Service Monitor
# Checks if backend/frontend are running and alerts on crashes
# ═══════════════════════════════════════════════════════════════

# Configuration
PID_DIR="/tmp/skylink"
PROJECT_ROOT="${SKYLINK_ROOT:-/home/mascris/project/JAVA/SkyLink}"
LOG_DIR="$PROJECT_ROOT/logs"
BACKEND_PORT=8080
FRONTEND_PORT=3000
BACKEND_HEALTH="http://localhost:$BACKEND_PORT/actuator/health"

# State file to track previous status
STATE_FILE="/tmp/skylink/monitor-state"
mkdir -p "$(dirname "$STATE_FILE")"

# Notification settings
ENABLE_DESKTOP_NOTIFY=true
ENABLE_SOUND=true
ENABLE_EMAIL=false
EMAIL_TO=""  # Set your email here

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ───────────────────────────────────────────────────────────────
# Notification Functions
# ───────────────────────────────────────────────────────────────

send_desktop_notification() {
    local title="$1"
    local message="$2"
    local urgency="${3:-normal}"  # low, normal, critical
    
    if [ "$ENABLE_DESKTOP_NOTIFY" = true ]; then
        if command -v notify-send >/dev/null 2>&1; then
            notify-send -u "$urgency" "$title" "$message"
        elif command -v osascript >/dev/null 2>&1; then
            # macOS notification
            osascript -e "display notification \"$message\" with title \"$title\""
        fi
    fi
}

play_alert_sound() {
    if [ "$ENABLE_SOUND" = true ]; then
        # Try different sound players
        if command -v paplay >/dev/null 2>&1; then
            paplay /usr/share/sounds/freedesktop/stereo/complete.oga 2>/dev/null &
        elif command -v afplay >/dev/null 2>&1; then
            # macOS
            afplay /System/Library/Sounds/Glass.aiff &
        elif command -v beep >/dev/null 2>&1; then
            beep
        else
            # Terminal bell as fallback
            echo -e "\a"
        fi
    fi
}

send_email_alert() {
    local subject="$1"
    local body="$2"
    
    if [ "$ENABLE_EMAIL" = true ] && [ -n "$EMAIL_TO" ]; then
        if command -v mail >/dev/null 2>&1; then
            echo "$body" | mail -s "$subject" "$EMAIL_TO"
        elif command -v sendmail >/dev/null 2>&1; then
            echo -e "Subject: $subject\n\n$body" | sendmail "$EMAIL_TO"
        fi
    fi
}

send_crash_alert() {
    local service="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    local title="🚨 SkyLink Alert: $service Crashed!"
    local message="$service stopped unexpectedly at $timestamp"
    
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}🚨 ALERT: $service CRASHED!${NC}"
    echo -e "${RED}Time: $timestamp${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    send_desktop_notification "$title" "$message" "critical"
    play_alert_sound
    send_email_alert "$title" "$message

Service: $service
Time: $timestamp
Log: $LOG_DIR/${service,,}.log

Please check the logs for more details."
}

send_recovery_alert() {
    local service="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    local title="✅ SkyLink: $service Recovered"
    local message="$service is back online at $timestamp"
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ RECOVERY: $service is back online${NC}"
    echo -e "${GREEN}Time: $timestamp${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    send_desktop_notification "$title" "$message" "normal"
}

# ───────────────────────────────────────────────────────────────
# Service Check Functions
# ───────────────────────────────────────────────────────────────

check_backend() {
    local pid_file="$PID_DIR/backend.pid"
    
    # Check if PID file exists
    if [ ! -f "$pid_file" ]; then
        echo "not_running"
        return
    fi
    
    local pid=$(cat "$pid_file")
    
    # Check if process is running
    if ! kill -0 "$pid" 2>/dev/null; then
        echo "crashed"
        return
    fi
    
    # Check if port is listening
    if ! (lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1 || nc -z localhost $BACKEND_PORT 2>/dev/null); then
        echo "unhealthy"
        return
    fi
    
    # Check health endpoint if available
    if command -v curl >/dev/null 2>&1; then
        if curl -s -f "$BACKEND_HEALTH" >/dev/null 2>&1; then
            echo "healthy"
            return
        fi
    fi
    
    echo "running"
}

check_frontend() {
    local pid_file="$PID_DIR/frontend.pid"
    
    # Check if PID file exists
    if [ ! -f "$pid_file" ]; then
        echo "not_running"
        return
    fi
    
    local pid=$(cat "$pid_file")
    
    # Check if process is running
    if ! kill -0 "$pid" 2>/dev/null; then
        echo "crashed"
        return
    fi
    
    # Check if port is listening
    if ! (lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1 || nc -z localhost $FRONTEND_PORT 2>/dev/null); then
        echo "unhealthy"
        return
    fi
    
    echo "healthy"
}

# ───────────────────────────────────────────────────────────────
# State Management
# ───────────────────────────────────────────────────────────────

get_previous_state() {
    local service="$1"
    if [ -f "$STATE_FILE" ]; then
        grep "^$service:" "$STATE_FILE" | cut -d: -f2
    else
        echo "unknown"
    fi
}

save_state() {
    local service="$1"
    local state="$2"
    
    # Create or update state file
    if [ -f "$STATE_FILE" ]; then
        # Update existing entry or add new one
        if grep -q "^$service:" "$STATE_FILE"; then
            sed -i "s/^$service:.*/$service:$state/" "$STATE_FILE"
        else
            echo "$service:$state" >> "$STATE_FILE"
        fi
    else
        echo "$service:$state" > "$STATE_FILE"
    fi
}

# ───────────────────────────────────────────────────────────────
# Main Monitoring Logic
# ───────────────────────────────────────────────────────────────

monitor_service() {
    local service="$1"
    local check_func="$2"
    
    local current_state=$($check_func)
    local previous_state=$(get_previous_state "$service")
    
    # Detect state changes
    if [ "$current_state" = "crashed" ] && [ "$previous_state" != "crashed" ] && [ "$previous_state" != "not_running" ]; then
        send_crash_alert "$service"
    elif [ "$current_state" = "healthy" ] && [ "$previous_state" = "crashed" ]; then
        send_recovery_alert "$service"
    fi
    
    # Save current state
    save_state "$service" "$current_state"
    
    echo "$current_state"
}

show_status() {
    local backend_status="$1"
    local frontend_status="$2"
    
    echo ""
    echo "📊 SkyLink Monitor - $(date '+%Y-%m-%d %H:%M:%S')"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Backend status
    echo -n "Backend:  "
    case "$backend_status" in
        healthy)
            echo -e "${GREEN}●${NC} Healthy"
            ;;
        running)
            echo -e "${YELLOW}●${NC} Running (health check unavailable)"
            ;;
        unhealthy)
            echo -e "${YELLOW}●${NC} Unhealthy (process alive but not responding)"
            ;;
        crashed)
            echo -e "${RED}●${NC} Crashed"
            ;;
        not_running)
            echo -e "${RED}●${NC} Not Running"
            ;;
    esac
    
    # Frontend status
    echo -n "Frontend: "
    case "$frontend_status" in
        healthy)
            echo -e "${GREEN}●${NC} Healthy"
            ;;
        running)
            echo -e "${YELLOW}●${NC} Running"
            ;;
        unhealthy)
            echo -e "${YELLOW}●${NC} Unhealthy (process alive but not responding)"
            ;;
        crashed)
            echo -e "${RED}●${NC} Crashed"
            ;;
        not_running)
            echo -e "${RED}●${NC} Not Running"
            ;;
    esac
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# ───────────────────────────────────────────────────────────────
# Script Modes
# ───────────────────────────────────────────────────────────────

run_once() {
    backend_status=$(monitor_service "Backend" check_backend)
    frontend_status=$(monitor_service "Frontend" check_frontend)
    show_status "$backend_status" "$frontend_status"
}

run_watch() {
    local interval="${1:-10}"  # Default 10 seconds
    
    echo "🔍 Starting SkyLink Monitor (checking every ${interval}s)"
    echo "Press Ctrl+C to stop"
    echo ""
    
    while true; do
        backend_status=$(monitor_service "Backend" check_backend)
        frontend_status=$(monitor_service "Frontend" check_frontend)
        
        # Clear screen and show status
        clear
        show_status "$backend_status" "$frontend_status"
        
        echo ""
        echo "Next check in ${interval}s... (Ctrl+C to stop)"
        
        sleep "$interval"
    done
}

show_usage() {
    echo "Usage: $0 [once|watch] [interval]"
    echo ""
    echo "Modes:"
    echo "  once          - Check services once and exit (default)"
    echo "  watch         - Continuously monitor services"
    echo ""
    echo "Options:"
    echo "  interval      - Seconds between checks in watch mode (default: 10)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Check once"
    echo "  $0 watch              # Monitor every 10 seconds"
    echo "  $0 watch 5            # Monitor every 5 seconds"
    echo ""
    echo "Notification Settings:"
    echo "  Desktop notifications: $ENABLE_DESKTOP_NOTIFY"
    echo "  Sound alerts: $ENABLE_SOUND"
    echo "  Email alerts: $ENABLE_EMAIL"
}

# ───────────────────────────────────────────────────────────────
# Main Entry Point
# ───────────────────────────────────────────────────────────────

MODE="${1:-once}"

case "$MODE" in
    once)
        run_once
        ;;
    watch)
        run_watch "${2:-10}"
        ;;
    -h|--help)
        show_usage
        ;;
    *)
        echo "Error: Invalid mode '$MODE'"
        echo ""
        show_usage
        exit 1
        ;;
esac
