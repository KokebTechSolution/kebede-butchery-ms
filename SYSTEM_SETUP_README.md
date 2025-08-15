# 🍖 Kebede Butchery Management System - Complete Setup Guide

## 🚀 Quick Start

The system is now fully configured and running! Here's how to use it:

### 1. Start the System
```bash
./start-system.sh
```

### 2. Stop the System
```bash
./stop-system.sh
```

### 3. Test the System
```bash
./test-api.sh
```

## 🌐 Access URLs

### Backend API
- **Local**: http://localhost:8000
- **Network**: http://192.168.100.122:8000
- **Dynamic Network**: http://[your-network-ip]:8000

### Frontend Application
- **Local**: http://localhost:3000
- **Network**: http://192.168.100.122:3000
- **Dynamic Network**: http://[your-network-ip]:3000

## 🔑 Test Login Credentials

**Username**: `waiter_user1`  
**Password**: `waiter123`

## 📋 What Was Fixed

### ✅ API Endpoints Working
- `/api/users/me/` - User authentication
- `/api/orders/order-list/` - Order management
- `/api/branches/tables/` - Table management
- `/api/users/login/` - User login
- `/api/users/csrf/` - CSRF token

### ✅ Network Access
- Backend accessible from both localhost and network IPs
- CORS properly configured for cross-origin requests
- Session management working across network

### ✅ Authentication System
- Session-based authentication working
- CSRF protection enabled
- Proper cookie handling for network access

### ✅ Frontend Integration
- React app properly configured
- API calls working with authentication
- Dynamic API URL detection

## 🛠️ System Components

### Backend (Django)
- **Port**: 8000
- **Framework**: Django 5.2.3 + Django REST Framework
- **Authentication**: Session-based + JWT support
- **Database**: SQLite (default)
- **CORS**: Enabled for development

### Frontend (React)
- **Port**: 3000
- **Framework**: React 19.1.0
- **State Management**: Context API
- **Styling**: Tailwind CSS
- **API Integration**: Axios with interceptors

## 🔧 Configuration Files

### Backend Configuration
- `backend/kebede_pos/settings.py` - Main Django settings
- `backend/kebede_pos/deployment_settings.py` - Network and CORS settings
- `backend/kebede_pos/urls.py` - API routing

### Frontend Configuration
- `frontend/src/api/config.js` - Dynamic API URL configuration
- `frontend/src/api/axiosInstance.js` - HTTP client configuration
- `frontend/src/context/AuthContext.jsx` - Authentication management

## 📁 Project Structure

```
kebede-butchery-ms/
├── backend/                 # Django backend
│   ├── kebede_pos/         # Django project
│   ├── users/              # User management app
│   ├── orders/             # Order management app
│   ├── branches/           # Branch/table management
│   └── manage.py           # Django management
├── frontend/               # React frontend
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React contexts
│   │   └── api/            # API configuration
│   └── package.json
├── start-system.sh         # Complete system startup
├── stop-system.sh          # System shutdown
├── test-api.sh             # API testing
└── README.md               # This file
```

## 🚦 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the ports
lsof -i :8000
lsof -i :3000

# Kill processes if needed
./stop-system.sh
```

#### 2. Frontend Not Loading
```bash
# Check if React is running
ps aux | grep "react-scripts"

# Restart frontend
cd frontend && npm start
```

#### 3. Backend API Errors
```bash
# Check Django logs
tail -f backend.log

# Test API endpoints
./test-api.sh
```

#### 4. Authentication Issues
```bash
# Clear browser cookies and localStorage
# Or restart the system
./stop-system.sh && ./start-system.sh
```

### Network Access Issues

#### 1. Firewall Settings
```bash
# Allow ports through firewall (Ubuntu/Debian)
sudo ufw allow 8000
sudo ufw allow 3000
```

#### 2. Network Interface
```bash
# Check network interfaces
ip addr show

# Check routing
ip route show
```

## 🔄 Development Workflow

### 1. Making Changes
1. Edit code in `frontend/src/` or `backend/`
2. Frontend auto-reloads on save
3. Backend may need restart for major changes

### 2. Testing Changes
```bash
# Test API endpoints
./test-api.sh

# Check frontend in browser
# Check backend logs
tail -f backend.log
```

### 3. Adding New Features
1. Create new Django app: `python manage.py startapp appname`
2. Add to `INSTALLED_APPS` in settings
3. Create models, views, serializers
4. Add URL patterns
5. Create React components
6. Update routing

## 📊 Monitoring

### Logs
- **Backend**: `backend.log`
- **Frontend**: `frontend.log`
- **Django**: Console output when running in foreground

### Health Checks
```bash
# Check system status
./test-api.sh

# Check running processes
ps aux | grep -E "(manage.py|react-scripts)"

# Check port usage
netstat -tlnp | grep -E "(8000|3000)"
```

## 🚀 Production Deployment

### Current Setup
- Development mode with `DEBUG=True`
- SQLite database
- HTTP (not HTTPS)
- CORS enabled for all origins

### Production Considerations
- Set `DEBUG=False`
- Use PostgreSQL/MySQL
- Enable HTTPS
- Restrict CORS origins
- Use environment variables for secrets
- Set up proper logging
- Use Gunicorn/uWSGI for Django
- Use Nginx for static files

## 📞 Support

If you encounter issues:

1. **Check logs**: `backend.log` and `frontend.log`
2. **Run tests**: `./test-api.sh`
3. **Restart system**: `./stop-system.sh && ./start-system.sh`
4. **Check network**: Ensure ports 8000 and 3000 are accessible

## 🎉 Success!

Your Kebede Butchery Management System is now fully operational with:
- ✅ Working backend API
- ✅ Working frontend application
- ✅ Network access from multiple IPs
- ✅ Proper authentication system
- ✅ All API endpoints functional
- ✅ Easy startup/shutdown scripts

Enjoy using your system! 🍖✨










