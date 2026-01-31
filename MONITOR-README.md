# 🔍 SkyLink Service Monitor

Automated monitoring system that detects when your Backend or Frontend crashes and sends you instant alerts.

## ✨ Features

- 🚨 **Instant crash detection** - Knows immediately when services die
- 🔔 **Multiple notification channels**:
  - Desktop notifications (Linux/macOS)
  - Sound alerts
  - Email alerts (optional)
- 🏥 **Health checks** - Pings Spring Boot actuator endpoint
- 📊 **Status tracking** - Remembers previous state to detect crashes
- 💚 **Recovery detection** - Alerts when service comes back online
- 🔄 **Flexible modes** - Run once, watch continuously, or schedule with cron

## 🚀 Quick Start

### 1. Basic Usage

```bash
# Check services once
./skylink-monitor.sh

# Continuously monitor (every 10 seconds)
./skylink-monitor.sh watch

# Monitor every 30 seconds
./skylink-monitor.sh watch 30
```

### 2. Set Up Automatic Monitoring

**Option A: Cron Job (Recommended for most users)**
```bash
./skylink-monitor-setup-cron.sh
# Choose your preferred interval (every 1, 5, 15, or 30 minutes)
```

**Option B: Systemd Service (Run as background service)**
```bash
# Copy the service file
sudo cp skylink-monitor.service /etc/systemd/system/

# Start the monitor
sudo systemctl start skylink-monitor

# Enable on boot
sudo systemctl enable skylink-monitor

# Check status
sudo systemctl status skylink-monitor
```

## 📋 What It Monitors

### Backend
- ✅ Process is running (PID check)
- ✅ Port 8080 is listening
- ✅ Health endpoint responds (`/actuator/health`)

### Frontend
- ✅ Process is running (PID check)
- ✅ Port 3000 is listening

## 🔔 Notification Types

### Desktop Notifications
Enabled by default. Works on:
- **Linux**: Uses `notify-send`
- **macOS**: Uses `osascript`

Example:
```
🚨 SkyLink Alert: Backend Crashed!
Backend stopped unexpectedly at 2025-01-31 14:23:45
```

### Sound Alerts
Plays a sound when crash is detected. Uses:
- `paplay` (Linux)
- `afplay` (macOS)
- Terminal bell (fallback)

### Email Alerts (Optional)
To enable email notifications:

1. Edit `skylink-monitor.sh`:
```bash
ENABLE_EMAIL=true
EMAIL_TO="your-email@example.com"
```

2. Make sure you have `mail` or `sendmail` installed:
```bash
# Ubuntu/Debian
sudo apt-get install mailutils

# macOS
# Built-in, no installation needed
```

## 🎯 Status Indicators

| Symbol | Status | Meaning |
|--------|--------|---------|
| 🟢 `●` Healthy | Everything is working perfectly |
| 🟡 `●` Running | Process alive but health check unavailable |
| 🟡 `●` Unhealthy | Process exists but not responding to requests |
| 🔴 `●` Crashed | Process died unexpectedly |
| 🔴 `●` Not Running | Service was never started |

## 📖 Usage Examples

### Development Workflow
```bash
# Start your services
./skylink-start.sh

# In another terminal, watch for crashes
./skylink-monitor.sh watch 5

# Work on your code...
# If something crashes, you'll get instant notification!
```

### Production-Like Monitoring
```bash
# Set up cron to check every 5 minutes
./skylink-monitor-setup-cron.sh
# Choose option 2 (every 5 minutes)

# View monitoring logs
tail -f /tmp/skylink/monitor-cron.log
```

### One-Time Health Check
```bash
# Just want to see current status?
./skylink-monitor.sh
```

## 🔧 Configuration

Edit these variables in `skylink-monitor.sh`:

```bash
# Notification settings
ENABLE_DESKTOP_NOTIFY=true   # Desktop popups
ENABLE_SOUND=true            # Sound alerts
ENABLE_EMAIL=false           # Email notifications
EMAIL_TO=""                  # Your email address

# Port configuration
BACKEND_PORT=8080
FRONTEND_PORT=3000

# Health check endpoint
BACKEND_HEALTH="http://localhost:8080/actuator/health"
```

## 📁 Files Created

```
/tmp/skylink/
├── monitor-state         # Tracks previous service states
└── monitor-cron.log      # Cron job output (if using cron)
```

## 🆘 Troubleshooting

### "Command not found: notify-send"
Desktop notifications won't work, but the script will still run. Install it:
```bash
# Ubuntu/Debian
sudo apt-get install libnotify-bin

# Fedora
sudo dnf install libnotify
```

### Email notifications not working
Make sure you have a mail client installed:
```bash
# Test email
echo "Test" | mail -s "Test Subject" your-email@example.com
```

### Cron job not running
Check cron logs:
```bash
# View cron log
tail -f /tmp/skylink/monitor-cron.log

# Check system cron logs
sudo tail -f /var/log/syslog | grep CRON  # Ubuntu/Debian
sudo tail -f /var/log/cron                # CentOS/RHEL
```

## 🎨 Customization Ideas

### Add Slack Notifications
```bash
send_slack_alert() {
    local message="$1"
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"$message\"}" \
        YOUR_SLACK_WEBHOOK_URL
}
```

### Add Discord Notifications
```bash
send_discord_alert() {
    local message="$1"
    curl -X POST -H "Content-Type: application/json" \
        -d "{\"content\":\"$message\"}" \
        YOUR_DISCORD_WEBHOOK_URL
}
```

### Monitor Additional Services
Add your own check functions:
```bash
check_database() {
    # Check if database is responding
    if psql -h localhost -U myuser -c "SELECT 1" >/dev/null 2>&1; then
        echo "healthy"
    else
        echo "crashed"
    fi
}
```

## 💡 Pro Tips

1. **Development Mode**: Use `watch 5` for quick crash detection
2. **Production Mode**: Use cron with 5-15 minute intervals
3. **Combine with logging**: Monitor + view logs together:
   ```bash
   ./skylink-monitor.sh watch & ./skylink-logs.sh both
   ```
4. **Test notifications**: Manually stop a service to test alerts:
   ```bash
   ./skylink-stop.sh
   ./skylink-monitor.sh  # Should show "crashed"
   ```

## 🔗 Integration with Other Scripts

The monitor works seamlessly with your other SkyLink scripts:

```bash
# Start services
./skylink-start.sh

# Set up monitoring
./skylink-monitor-setup-cron.sh

# Check status anytime
./skylink-status.sh

# View logs
./skylink-logs.sh both

# Stop everything
./skylink-stop.sh
```

## 📊 Monitoring Dashboard Idea

Want a quick dashboard? Create this alias:

```bash
alias sky-dash='watch -n 5 "skylink-monitor.sh && echo && tail -n 10 /tmp/skylink/monitor-cron.log"'
```

Then just run `sky-dash` for a live updating dashboard!

## 🤝 Contributing

Found a bug? Want to add a feature? The monitor script is easy to extend:

1. Add new notification methods in the "Notification Functions" section
2. Add new service checks in the "Service Check Functions" section
3. Modify alerting logic in the "Main Monitoring Logic" section

---

**Happy monitoring! Your services are now under 24/7 surveillance!** 🔍👀
