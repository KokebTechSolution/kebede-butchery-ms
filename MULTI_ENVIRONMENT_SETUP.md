# 🌍 Multi-Environment Setup Guide

This guide explains how to use your application with both local development and production deployments.

## 🏗️ **Architecture Overview**

- **Frontend**: React app (can be deployed to Vercel)
- **Backend**: Django API (deployed to Render)
- **Database**: PostgreSQL (production) / SQLite (development)

## 🚀 **Environment Configurations**

### 1. **Local Development**
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:8000`
- **Database**: SQLite (`db.sqlite3`)

### 2. **Production Deployment**
- **Frontend**: Vercel deployment
- **Backend**: Render deployment (`https://kebede-butchery-ms.onrender.com`)
- **Database**: PostgreSQL (Render managed)

## 🛠️ **Quick Start Commands**

### **Local Development**

1. **Start Backend (Django)**:
   ```bash
   cd backend
   python manage.py runserver 8000
   ```

2. **Start Frontend (React)**:
   ```bash
   cd frontend
   # Option 1: Use the script
   scripts/start-local.bat
   
   # Option 2: Manual
   set REACT_APP_API_URL=http://localhost:8000
   npm start
   ```

### **Production Testing**

1. **Test with Production Backend**:
   ```bash
   cd frontend
   # Option 1: Use the script
   scripts/start-production.bat
   
   # Option 2: Manual
   set REACT_APP_API_URL=https://kebede-butchery-ms.onrender.com
   npm start
   ```

## 🔧 **Environment Variables**

### **Frontend Environment Variables**

| Variable | Local | Production | Description |
|----------|-------|------------|-------------|
| `NODE_ENV` | `development` | `production` | React environment |
| `REACT_APP_API_URL` | `http://localhost:8000` | `https://kebede-butchery-ms.onrender.com` | Backend API URL |
| `VERCEL` | `undefined` | `1` | Vercel deployment flag |

### **Backend Environment Variables**

| Variable | Local | Production | Description |
|----------|-------|------------|-------------|
| `DATABASE_URL` | `sqlite:///db.sqlite3` | PostgreSQL URL | Database connection |
| `DEBUG` | `True` | `False` | Django debug mode |
| `ALLOWED_HOSTS` | `localhost` | Render domain | CORS allowed hosts |

## 🌐 **CORS Configuration**

The backend is configured to allow requests from:
- `http://localhost:3000` (local development)
- `https://kebede-butchery-ms.vercel.app` (Vercel deployment)
- `https://kebede-butchery-h741toz7z-alki45s-projects.vercel.app` (Vercel preview)

## 📱 **Usage Scenarios**

### **Scenario 1: Full Local Development**
```bash
# Terminal 1: Start Django backend
cd backend
python manage.py runserver 8000

# Terminal 2: Start React frontend
cd frontend
scripts/start-local.bat
```

### **Scenario 2: Local Frontend + Production Backend**
```bash
# Start React frontend with production backend
cd frontend
scripts/start-production.bat
```

### **Scenario 3: Production Deployment**
- Frontend automatically deployed to Vercel
- Backend automatically deployed to Render
- Both use production database

## 🔍 **Debugging**

### **Check Current Environment**
Open browser console and look for:
```
[API Config] Environment: development
[API Config] API Base URL: http://localhost:8000
```

### **Common Issues**

1. **CORS Errors**: Check if backend CORS settings include your frontend URL
2. **Database Errors**: Ensure migrations are run (`python manage.py migrate`)
3. **Port Conflicts**: Make sure ports 3000 and 8000 are available

## 🚀 **Deployment**

### **Frontend (Vercel)**
- Connect your GitHub repository to Vercel
- Vercel will automatically detect React app
- Environment variables are set automatically

### **Backend (Render)**
- Connect your GitHub repository to Render
- Set environment variables in Render dashboard
- Render will automatically deploy on push to main branch

## 📊 **Monitoring**

### **Local Development**
- Django admin: `http://localhost:8000/admin/`
- React dev tools: Browser developer tools
- API testing: `http://localhost:8000/api/users/health/`

### **Production**
- Backend health: `https://kebede-butchery-ms.onrender.com/api/users/health/`
- Frontend: Your Vercel URL
- Database: Render PostgreSQL dashboard

## 🔄 **Switching Environments**

To switch between environments:

1. **Stop current servers** (Ctrl+C)
2. **Use appropriate script**:
   - `scripts/start-local.bat` for local development
   - `scripts/start-production.bat` for production testing
3. **Check console logs** to confirm correct API URL

## 📝 **Notes**

- Local development uses SQLite for faster setup
- Production uses PostgreSQL for reliability
- CORS is configured for both environments
- Environment variables are automatically detected
- Vercel deployment uses production backend by default 