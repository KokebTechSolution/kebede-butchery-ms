# Deployment Guide

## 🚀 **Ready for Deployment!**

Your project is now configured for deployment on Vercel (Frontend) and Render (Backend).

## 📋 **Deployment Steps**

### **Backend (Render)**

1. **Go to [Render.com](https://render.com)**
2. **Create a new Web Service**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name**: `kebede-butchery-ms-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `chmod +x build.sh && ./build.sh`
   - **Start Command**: `gunicorn kebede_pos.wsgi:application`

5. **Add Environment Variables:**
   ```
   DEBUG=False
   SECRET_KEY=your-secret-key-here
   DATABASE_URL=your-postgresql-url
   ```

### **Frontend (Vercel)**

1. **Go to [Vercel.com](https://vercel.com)**
2. **Import your GitHub repository**
3. **Configure the project:**
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

4. **Environment Variables (optional - already set in vercel.json):**
   ```
   REACT_APP_API_URL=https://kebede-butchery-ms.onrender.com
   NODE_ENV=production
   ```

## 🔧 **Environment Configuration**

### **Local Development**
```bash
# Start backend
cd backend
python manage.py runserver

# Start frontend (in new terminal)
cd frontend
start-local.bat  # or npm start
```

### **Production**
- **Backend**: Automatically deployed on Render
- **Frontend**: Automatically deployed on Vercel
- **Database**: PostgreSQL on Render

## ✅ **What's Ready**

1. **Multi-environment support** ✅
2. **CSRF token handling** ✅
3. **Session management** ✅
4. **Security configurations** ✅
5. **Build scripts** ✅
6. **Environment variables** ✅

## 🎯 **Testing After Deployment**

1. **Test login functionality**
2. **Test table creation**
3. **Test all user roles**
4. **Verify CSRF protection works**

## 📞 **Support**

If you encounter issues:
1. Check the deployment logs
2. Verify environment variables
3. Test the API endpoints directly
4. Check browser console for errors

Your project is ready for deployment! 🎉 