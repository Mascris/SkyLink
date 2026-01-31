#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# Setup Cron Job for SkyLink Monitoring
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITOR_SCRIPT="$SCRIPT_DIR/skylink-monitor.sh"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🔧 SkyLink Monitor Cron Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if monitor script exists
if [ ! -f "$MONITOR_SCRIPT" ]; then
    echo "❌ Monitor script not found: $MONITOR_SCRIPT"
    exit 1
fi

# Make sure it's executable
chmod +x "$MONITOR_SCRIPT"

echo "Choose monitoring frequency:"
echo ""
echo "  1) Every 1 minute  (recommended for active development)"
echo "  2) Every 5 minutes (balanced)"
echo "  3) Every 15 minutes (light monitoring)"
echo "  4) Every 30 minutes (minimal)"
echo "  5) Custom interval"
echo "  6) Remove cron job"
echo ""
read -p "Enter choice [1-6]: " choice

case $choice in
    1)
        CRON_SCHEDULE="* * * * *"
        DESCRIPTION="every minute"
        ;;
    2)
        CRON_SCHEDULE="*/5 * * * *"
        DESCRIPTION="every 5 minutes"
        ;;
    3)
        CRON_SCHEDULE="*/15 * * * *"
        DESCRIPTION="every 15 minutes"
        ;;
    4)
        CRON_SCHEDULE="*/30 * * * *"
        DESCRIPTION="every 30 minutes"
        ;;
    5)
        echo ""
        echo "Enter cron schedule (e.g., '*/2 * * * *' for every 2 minutes):"
        read -p "Schedule: " CRON_SCHEDULE
        DESCRIPTION="custom schedule"
        ;;
    6)
        # Remove existing cron job
        (crontab -l 2>/dev/null | grep -v "skylink-monitor.sh") | crontab -
        echo -e "${GREEN}✅ SkyLink monitor cron job removed${NC}"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

# Create the cron job
CRON_JOB="$CRON_SCHEDULE $MONITOR_SCRIPT once >> /tmp/skylink/monitor-cron.log 2>&1"

# Remove existing skylink-monitor cron jobs
(crontab -l 2>/dev/null | grep -v "skylink-monitor.sh") | crontab -

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo ""
echo -e "${GREEN}✅ Cron job installed successfully!${NC}"
echo ""
echo -e "${BLUE}Schedule:${NC} $DESCRIPTION"
echo -e "${BLUE}Command:${NC} $MONITOR_SCRIPT once"
echo -e "${BLUE}Log file:${NC} /tmp/skylink/monitor-cron.log"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}📝 Tips:${NC}"
echo "  • View cron log: tail -f /tmp/skylink/monitor-cron.log"
echo "  • List cron jobs: crontab -l"
echo "  • Remove cron job: Run this script again and choose option 6"
echo ""
