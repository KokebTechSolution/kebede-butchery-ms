# 🚀 Deployment Guide - Vercel + Render

This guide will help you deploy your Kebede Butchery application to production using **Vercel** for the frontend and **Render** for the backend.

## 📋 Prerequisites

- [GitHub](https://github.com) account
- [Vercel](https://vercel.com) account (free)
- [Render](https://render.com) account (free tier available)
- [PostgreSQL](https://www.postgresql.org/) database (Render provides this)

## 🎯 Step-by-Step Deployment

### **1. Backend Deployment (Render)**

#### **1.1 Prepare Your Repository**
```bash
# Ensure your backend code is committed to GitHub
cd kebede-butchery-ms/backend
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

#### **1.2 Deploy to Render**

1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**

   **Basic Settings:**
   - **Name**: `kebede-butchery-backend`
   - **Environment**: `Python 3`
   - **Region**: Choose closest to your users
   - **Branch**: `main`

   **Build & Deploy:**
   - **Build Command**: `chmod +x build.sh && ./build.sh`
   - **Start Command**: `gunicorn kebede_pos.wsgi:application`

   **Environment Variables:**
   ```
   SECRET_KEY=your-super-secret-key-here
   DATABASE_URL=postgresql://user:password@host:port/database
   RENDER=true
   DJANGO_SETTINGS_MODULE=kebede_pos.settings_production
   ```

5. **Click "Create Web Service"**

#### **1.3 Set Up PostgreSQL Database**

1. **In Render Dashboard, click "New +" → "PostgreSQL"**
2. **Configure:**
   - **Name**: `kebede-butchery-db`
   - **Database**: `kebede_butchery`
   - **User**: `kebede_user`
   - **Region**: Same as your web service
3. **Copy the `DATABASE_URL` and add it to your web service environment variables**

#### **1.4 Update CORS Settings**

After deployment, update `settings_production.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-name.vercel.app",  # Your Vercel URL
    "http://localhost:3000",
]
```

### **2. Frontend Deployment (Vercel)**

#### **2.1 Prepare Frontend Configuration**

1. **Update the production config:**
   ```javascript
   // src/config/production.js
   export const PRODUCTION_CONFIG = {
     API_BASE_URL: 'https://your-backend-name.onrender.com',  // Your Render URL
     ENVIRONMENT: 'production'
   };
   ```

2. **Commit and push:**
   ```bash
   cd kebede-butchery-ms/frontend
   git add .
   git commit -m "Update production API URL"
   git push origin main
   ```

#### **2.2 Deploy to Vercel**

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure:**
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

5. **Add Environment Variables:**
   ```
   NODE_ENV=production
   ```

6. **Click "Deploy"**

### **3. Post-Deployment Setup**

#### **3.1 Create Superuser**
```bash
# In Render dashboard, go to your web service
# Click "Shell" and run:
python manage.py createsuperuser
```

#### **3.2 Test Your Application**
1. **Frontend**: Visit your Vercel URL
2. **Backend**: Test API endpoints at your Render URL
3. **Database**: Verify data persistence

#### **3.3 Set Up Custom Domain (Optional)**
- **Vercel**: Add custom domain in project settings
- **Render**: Add custom domain in web service settings

## 🔧 Troubleshooting

### **Common Issues:**

#### **Backend (Render):**
- **Build Failures**: Check `requirements.txt` and `build.sh`
- **Database Connection**: Verify `DATABASE_URL` format
- **CORS Errors**: Update `CORS_ALLOWED_ORIGINS` with your Vercel URL

#### **Frontend (Vercel):**
- **API Calls Failing**: Check production config URL
- **Build Errors**: Verify all dependencies in `package.json`
- **Routing Issues**: Check `vercel.json` configuration

### **Debug Commands:**
```bash
# Check Render logs
# Go to your web service → Logs

# Check Vercel build logs
# Go to your project → Deployments → Latest → Functions
```

## 📊 Monitoring & Maintenance

### **Render Dashboard:**
- Monitor web service health
- Check database performance
- View application logs

### **Vercel Dashboard:**
- Monitor frontend performance
- Check build status
- View analytics

## 🔒 Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **CORS**: Only allow necessary origins
3. **HTTPS**: Both Vercel and Render provide SSL by default
4. **Database**: Use strong passwords and limit access

## 💰 Cost Optimization

### **Render Free Tier:**
- Web services: 750 hours/month
- PostgreSQL: 90 days free trial
- **Upgrade when needed**

### **Vercel Free Tier:**
- Unlimited deployments
- Custom domains
- **Perfect for most projects**

## 🎉 Success Checklist

- [ ] Backend deployed to Render
- [ ] Database connected and working
- [ ] Frontend deployed to Vercel
- [ ] API calls working between services
- [ ] CORS properly configured
- [ ] Superuser account created
- [ ] Application tested end-to-end
- [ ] Custom domains configured (if needed)

## 📞 Support

- **Render**: [Documentation](https://render.com/docs)
- **Vercel**: [Documentation](https://vercel.com/docs)
- **Django**: [Deployment Guide](https://docs.djangoproject.com/en/4.2/howto/deployment/)

---

**Happy Deploying! 🚀**

Your Kebede Butchery application will be live and accessible from anywhere in the world!
