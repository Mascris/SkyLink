# SkyLink Management Scripts

A complete set of scripts to manage your SkyLink application (Spring Boot backend + npm frontend).

## 📦 What's Included

- **skylink-start.sh** - Start both backend and frontend
- **skylink-stop.sh** - Stop both services gracefully
- **skylink-status.sh** - Check if services are running
- **skylink-logs.sh** - View application logs

## 🚀 Quick Start

### 1. Install the Scripts

Copy all `.sh` files to your project root or add them to your PATH:

```bash
cp skylink-*.sh /home/mascris/project/JAVA/SkyLink/
cd /home/mascris/project/JAVA/SkyLink/
chmod +x skylink-*.sh
```

### 2. Start SkyLink

```bash
./skylink-start.sh
```

This will:
- ✅ Validate directories exist
- ✅ Start backend and wait for it to be healthy
- ✅ Start frontend and wait for it to be ready
- ✅ Show you the URLs and log locations
- ✅ Keep running until you press Ctrl+C

### 3. Check Status

```bash
./skylink-status.sh
```

Shows:
- Running status (with colored indicators)
- Process IDs
- Port numbers
- URLs

### 4. View Logs

```bash
# View both logs
./skylink-logs.sh

# View only backend logs
./skylink-logs.sh backend

# View only frontend logs
./skylink-logs.sh frontend
```

### 5. Stop Services

```bash
# Option 1: Press Ctrl+C in the start script terminal
# Option 2: Run the stop script
./skylink-stop.sh
```

## ⚙️ Configuration

You can customize the project root by setting an environment variable:

```bash
export SKYLINK_ROOT=/custom/path/to/SkyLink
./skylink-start.sh
```

Or edit the scripts directly to change:
- `PROJECT_ROOT` - Base directory
- `BACKEND_PORT` - Backend port (default: 8080)
- `FRONTEND_PORT` - Frontend port (default: 3000)

## 📁 File Locations

The scripts create these directories:
- `/tmp/skylink/` - PID files (survives terminal close)
- `$PROJECT_ROOT/logs/` - Log files
  - `backend.log`
  - `frontend.log`

## ✨ Key Features

### skylink-start.sh
- 🔍 Directory validation
- 🏥 Real health checks (pings Spring Boot actuator endpoint)
- 🔄 Port listening verification
- 🛡️ Prevents duplicate instances
- 🧹 Auto-cleanup on Ctrl+C or errors
- 📝 Persistent PID files
- ⏱️ Smart timeouts (60s backend, 30s frontend)

### skylink-stop.sh
- 💚 Graceful shutdown first (SIGTERM)
- ⚡ Force kill if needed (SIGKILL)
- 🧹 Cleans up PID files
- 📊 Shows what was stopped

### skylink-status.sh
- 🎨 Color-coded status
- 🔌 Port listening checks
- 📍 PID and URL display

### skylink-logs.sh
- 📺 Real-time log streaming
- 🎯 Filter by service
- 🔄 Side-by-side view (with multitail if installed)
- 🏷️ Labeled output for both logs

## 🆚 Comparison with Original Script

| Feature | Original | New Scripts |
|---------|----------|-------------|
| Health Checks | Basic (10s sleep) | Real HTTP endpoint checks |
| Cleanup on Exit | Manual | Automatic (Ctrl+C) |
| Log Location | Current dir | Dedicated logs/ folder |
| Stop Script | Manual kill | Dedicated stop script |
| Status Check | None | Dedicated status script |
| Duplicate Prevention | None | PID file checks |
| Error Handling | Basic | Comprehensive |
| Portability | Hardcoded paths | Configurable |

## 🛠️ Troubleshooting

**Backend won't start?**
```bash
tail -f ~/project/JAVA/SkyLink/logs/backend.log
```

**Frontend won't start?**
```bash
tail -f ~/project/JAVA/SkyLink/logs/frontend.log
```

**Port already in use?**
```bash
# Find what's using the port
lsof -i :8080  # backend
lsof -i :3000  # frontend

# Kill the process
kill -9 <PID>
```

**Scripts say "already running" but nothing is running?**
```bash
# Clean up stale PID files
rm /tmp/skylink/*.pid
```

## 💡 Pro Tips

1. **Add to PATH** for system-wide access:
   ```bash
   echo 'export PATH="$PATH:/home/mascris/project/JAVA/SkyLink"' >> ~/.bashrc
   source ~/.bashrc
   # Now you can run from anywhere:
   skylink-start.sh
   ```

2. **Create aliases** for even faster access:
   ```bash
   alias sky-start='~/project/JAVA/SkyLink/skylink-start.sh'
   alias sky-stop='~/project/JAVA/SkyLink/skylink-stop.sh'
   alias sky-status='~/project/JAVA/SkyLink/skylink-status.sh'
   alias sky-logs='~/project/JAVA/SkyLink/skylink-logs.sh'
   ```

3. **Run in background** (without keeping terminal open):
   ```bash
   nohup ./skylink-start.sh &
   # Check logs with:
   ./skylink-logs.sh
   ```

## 📝 Requirements

- Bash 4.0+
- `curl` (for health checks)
- `lsof` or `nc` (for port checking)
- `multitail` (optional, for better dual log viewing)

## 🤝 Contributing

Feel free to modify these scripts for your needs. Common customizations:
- Different ports
- Additional health check endpoints
- Custom logging formats
- Integration with process managers (systemd, pm2)
