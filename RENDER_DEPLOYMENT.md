# 🚀 Render Deployment Guide - Single Service Method

## Prerequisites
- GitHub account with your code pushed
- Render account (render.com)
- Your project ready with all the files we just created

## Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

## Step 2: Create Render Web Service

1. **Login to Render**: Go to render.com and sign in
2. **New Web Service**: Click "New" → "Web Service"
3. **Connect Repository**: Connect your GitHub repo `kebede-butchery-ms`
4. **Configure Service**:
   - **Name**: `kebede-pos-app` (or your choice)
   - **Environment**: `Python 3`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave empty (uses project root)

## Step 3: Build & Start Commands

### Build Command:
```bash
chmod +x build.sh && ./build.sh
```

### Start Command:
```bash
cd backend && python manage.py migrate --noinput && gunicorn kebede_pos.wsgi:application --bind 0.0.0.0:$PORT
```

## Step 4: Environment Variables

In Render dashboard, add these environment variables:

**Required:**
- `SECRET_KEY`: Generate a secure key (use Django secret key generator)
- `DEBUG`: `False`
- `RENDER`: `True`
- `PYTHON_VERSION`: `3.9.18`
- `NODE_VERSION`: `18`

**Database (will be auto-generated):**
- `DATABASE_URL`: (Render will provide this when you add PostgreSQL)

## Step 5: Add PostgreSQL Database

1. **New PostgreSQL**: Click "New" → "PostgreSQL"
2. **Configure**:
   - **Name**: `kebede-pos-db`
   - **Region**: Same as your web service
   - **Plan**: Free tier
3. **Connect**: Copy the `DATABASE_URL` to your web service environment variables

## Step 6: Deploy

1. **Deploy**: Click "Create Web Service"
2. **Wait**: Build process takes 5-10 minutes
3. **Check logs**: Monitor build progress
4. **Test**: Visit your Render URL when deployment completes

## Step 7: Create Superuser (After Deployment)

1. **Shell Access**: In Render dashboard, go to "Shell"
2. **Create Superuser**:
```bash
cd backend
python manage.py createsuperuser
```

## Your App URLs:

- **Main App**: `https://your-app-name.onrender.com`
- **Admin**: `https://your-app-name.onrender.com/admin`
- **API**: `https://your-app-name.onrender.com/api/`

## Troubleshooting:

### Build Fails:
- Check build logs in Render dashboard
- Ensure Node.js version is compatible
- Verify all dependencies in requirements.txt

### App Won't Start:
- Check start command logs
- Verify DATABASE_URL is set
- Check SECRET_KEY is set

### Static Files Issues:
- Ensure build.sh runs successfully
- Check STATIC_ROOT settings
- Verify whitenoise is installed

### Database Issues:
- Ensure DATABASE_URL is correct
- Run migrations: `python manage.py migrate`
- Check PostgreSQL service is running

## Success Indicators:

✅ Build completes without errors
✅ Django migrations run successfully  
✅ React app loads at your domain
✅ API endpoints respond correctly
✅ Admin panel accessible

## What This Setup Gives You:

🎯 **Single Service** - Everything in one place
💰 **Cost Effective** - One service fee only
🔒 **Secure** - HTTPS automatically enabled
🌍 **Global CDN** - Fast loading worldwide
📊 **Monitoring** - Built-in logs and metrics
🔄 **Auto Deploys** - Pushes to GitHub deploy automatically

Your Django + React app will be live at: `https://your-app-name.onrender.com`
