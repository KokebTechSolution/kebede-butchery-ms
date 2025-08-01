# 🚀 Kebede Butchery MS - Startup Scripts

This directory contains scripts to easily start and stop your Django backend and React frontend.

## 📁 Available Scripts

### 1. `start-app.sh` - Complete Startup Script
**Full-featured script with error checking and status monitoring**

```bash
./start-app.sh
```

**Features:**
- ✅ Checks for existing processes and stops them
- ✅ Validates virtual environment and dependencies
- ✅ Installs missing dependencies automatically
- ✅ Shows real-time status of both servers
- ✅ Graceful shutdown with Ctrl+C
- ✅ Color-coded output for easy reading

### 2. `quick-start.sh` - Fast Startup Script
**Simple and fast script for quick testing**

```bash
./quick-start.sh
```

**Features:**
- ⚡ Fast startup
- 🛑 Stops existing processes
- 📊 Shows basic status
- 🎯 Perfect for development

### 3. `stop-app.sh` - Stop Script
**Cleanly stops both servers**

```bash
./stop-app.sh
```

**Features:**
- 🛑 Stops Django backend
- 🛑 Stops React frontend
- 🔍 Checks if ports are free
- ✅ Confirms all processes stopped

## 🎯 Quick Start

1. **Start the application:**
   ```bash
   ./start-app.sh
   ```

2. **Access your application:**
   - **Local**: http://localhost:3000
   - **Network**: http://192.168.1.8:3000

3. **Login credentials:**
   - **Username**: `waiter_user1`
   - **Password**: `testpass123`

4. **Stop the application:**
   ```bash
   ./stop-app.sh
   ```

## 🌐 Access URLs

| Service | Local Access | Network Access |
|---------|-------------|----------------|
| Frontend | http://localhost:3000 | http://192.168.1.8:3000 |
| Backend API | http://localhost:8000 | http://192.168.1.8:8000 |

## 🔧 Troubleshooting

### If ports are already in use:
```bash
./stop-app.sh
./start-app.sh
```

### If dependencies are missing:
The `start-app.sh` script will automatically install missing dependencies.

### If virtual environment is missing:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 📱 Network Access

Other devices on your WiFi network can access:
- **Phone/Tablet**: http://192.168.1.8:3000
- **Other computers**: http://192.168.1.8:3000

## 🎉 Features

- **Session Management**: ✅ Fixed and working
- **Cross-Origin Support**: ✅ Configured for both local and network access
- **Authentication**: ✅ Login persistence working
- **Real-time Updates**: ✅ Both servers restart automatically on code changes

## 💡 Tips

- Use `start-app.sh` for development (more features)
- Use `quick-start.sh` for quick testing
- Press `Ctrl+C` to stop both servers gracefully
- The scripts handle all the environment setup automatically 