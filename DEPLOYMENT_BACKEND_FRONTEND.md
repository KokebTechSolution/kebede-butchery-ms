# 🚀 Complete Deployment Guide: Backend (Render) + Frontend (Netlify)

## Overview
This guide will help you deploy your Django backend to Render and React frontend to Netlify.

## 📋 Prerequisites
- GitHub repository with your code
- Render account (free)
- Netlify account (free)

## 🎯 Step 1: Deploy Backend to Render

### 1.1 Prepare Backend
Your backend is already configured for Render deployment with:
- ✅ `requirements.txt` - Dependencies
- ✅ `build.sh` - Build script
- ✅ Production settings in `settings.py`

### 1.2 Deploy to Render

1. **Go to Render**
   - Visit [render.com](https://render.com)
   - Sign up/Login with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

3. **Configure Service**
   - **Name**: `kebede-backend` (or your choice)
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn kebede_pos.wsgi:application`

4. **Add Environment Variables**
   - Click "Environment" tab
   - Add these variables:
   ```
   DATABASE_NAME=your_db_name
   DATABASE_USER=your_db_user
   DATABASE_PASSWORD=your_db_password
   DATABASE_HOST=your_db_host
   DATABASE_PORT=5432
   SECRET_KEY=your-secret-key-here
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)

### 1.3 Get Your Backend URL
After deployment, you'll get a URL like:
`https://kebede-backend.onrender.com`

## 🎯 Step 2: Deploy Frontend to Netlify

### 2.1 Update Frontend Configuration

1. **Update Backend URL**
   Edit `frontend/src/api/axiosInstance.js`:
   ```javascript
   return isProduction ? 'https://your-backend-domain.onrender.com/api/' : 'http://localhost:8000/api/';
   ```
   Replace `your-backend-domain` with your actual Render URL.

2. **Update CORS Settings**
   Edit `backend/kebede_pos/settings.py`:
   ```python
   CORS_ALLOWED_ORIGINS = [
       "http://localhost:3000",
       "https://your-frontend-domain.netlify.app",  # Add your Netlify domain
   ]
   ```

### 2.2 Deploy to Netlify

1. **Go to Netlify**
   - Visit [netlify.com](https://netlify.com)
   - Sign up/Login with GitHub

2. **Create New Site**
   - Click "New site from Git"
   - Choose your GitHub repository

3. **Configure Build Settings**
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`

4. **Add Environment Variables**
   - Go to Site settings → Environment variables
   - Add: `REACT_APP_BACKEND_URL=https://your-backend-domain.onrender.com/api/`

5. **Deploy**
   - Click "Deploy site"
   - Wait for deployment

## 🔧 Step 3: Configure Database

### Option A: Use Render's PostgreSQL (Recommended)

1. **Create Database on Render**
   - Go to Render Dashboard
   - Click "New +" → "PostgreSQL"
   - Name: `kebede-database`
   - Click "Create Database"

2. **Get Database Credentials**
   - Copy the database URL
   - Update your backend environment variables

3. **Run Migrations**
   - Your `build.sh` script will run migrations automatically

### Option B: Use External Database
- Railway, Supabase, or any PostgreSQL provider

## 🔄 Step 4: Update URLs

### 4.1 Update Frontend
After getting your Netlify URL, update the backend CORS settings:

```python
# In backend/kebede_pos/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://your-actual-frontend.netlify.app",  # Your real Netlify URL
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "https://your-actual-frontend.netlify.app",  # Your real Netlify URL
]
```

### 4.2 Redeploy Backend
- Push changes to GitHub
- Render will auto-deploy

## 🎯 Step 5: Test Your Deployment

### 5.1 Test Backend
```bash
# Test your backend API
curl https://your-backend-domain.onrender.com/api/orders/order-list/
```

### 5.2 Test Frontend
- Visit your Netlify URL
- Try logging in with test credentials
- Test all features

## 📊 Your Final URLs

- **Backend API**: `https://your-backend-domain.onrender.com`
- **Frontend App**: `https://your-frontend-domain.netlify.app`

## 🔧 Environment Variables Summary

### Backend (Render)
```
DATABASE_NAME=your_db_name
DATABASE_USER=your_db_user
DATABASE_PASSWORD=your_db_password
DATABASE_HOST=your_db_host
DATABASE_PORT=5432
SECRET_KEY=your-secret-key
```

### Frontend (Netlify)
```
REACT_APP_BACKEND_URL=https://your-backend-domain.onrender.com/api/
```

## 🎯 Test Credentials

Use these credentials to test your deployed app:

| Role | Username | Password |
|------|----------|----------|
| Waiter | waiter1 | 12345678 |
| Bartender | bartender1 | 12345678 |
| Meat Counter | meat1 | 12345678 |
| Cashier | cashier1 | 12345678 |
| Manager | manager1 | 12345678 |
| Owner | owner1 | 12345678 |

## 🚨 Troubleshooting

### Backend Issues
1. **Build fails**: Check `requirements.txt` and `build.sh`
2. **Database connection**: Verify environment variables
3. **CORS errors**: Update CORS settings with correct frontend URL

### Frontend Issues
1. **API calls fail**: Check backend URL in environment variables
2. **Build fails**: Check for JavaScript errors
3. **Authentication issues**: Verify backend is running

## 🎉 Success!

Once deployed, you'll have:
- ✅ **Real Database**: Persistent data storage
- ✅ **Real API**: Full backend functionality
- ✅ **Free Hosting**: Both services offer free tiers
- ✅ **Auto-deploy**: Updates on Git push

## 📞 Support

If you encounter issues:
1. Check Render deployment logs
2. Check Netlify deployment logs
3. Verify environment variables
4. Test API endpoints directly

---

**Happy Deployment! 🚀** 