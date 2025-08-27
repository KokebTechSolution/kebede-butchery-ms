# Frontend Deployment Guide for Render

## Prerequisites
- Your backend is already deployed on Render
- You have the Render backend URL (e.g., `https://your-backend-name.onrender.com`)

## Step 1: Update Environment Variables

1. **Update `.env.production` file:**
   Replace `YOUR_RENDER_BACKEND_URL` with your actual Render backend URL:
   ```
   REACT_APP_API_BASE_URL=https://your-actual-backend-name.onrender.com/api
   REACT_APP_BACKEND_URL=https://your-actual-backend-name.onrender.com
   ```

2. **Update `render.yaml` file:**
   Replace `YOUR_RENDER_BACKEND_URL` with your actual Render backend URL in the `render.yaml` file.

## Step 2: Deploy to Render

### Option A: Using Render Dashboard (Recommended)

1. **Go to Render Dashboard:**
   - Visit [render.com](https://render.com)
   - Sign in to your account

2. **Create New Static Site:**
   - Click "New +" button
   - Select "Static Site"

3. **Connect Repository:**
   - Connect your GitHub repository
   - Select the `kebede-butchery-ms` repository
   - Set the **Root Directory** to `frontend`

4. **Configure Build Settings:**
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `build`
   - **Node Version:** 18 or 20

5. **Set Environment Variables:**
   - `REACT_APP_API_BASE_URL`: `https://your-backend-name.onrender.com/api`
   - `REACT_APP_BACKEND_URL`: `https://your-backend-name.onrender.com`

6. **Deploy:**
   - Click "Create Static Site"
   - Wait for deployment to complete

### Option B: Using render.yaml (Alternative)

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Deploy using render.yaml:**
   - Go to Render Dashboard
   - Click "New +" → "Blueprint"
   - Connect your repository
   - Render will automatically detect and use the `render.yaml` file

## Step 3: Configure CORS (Backend)

Make sure your Django backend allows requests from your frontend domain:

1. **In your Django settings:**
   ```python
   CORS_ALLOWED_ORIGINS = [
       "https://your-frontend-name.onrender.com",
       "http://localhost:3000",  # For development
   ]
   ```

2. **Redeploy your backend** if needed.

## Step 4: Test Your Deployment

1. **Visit your frontend URL** (provided by Render)
2. **Test key functionality:**
   - Login
   - Product management
   - API calls
   - Navigation

## Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Ensure your backend CORS settings include your frontend domain
   - Check that environment variables are set correctly

2. **API Connection Issues:**
   - Verify your backend URL is correct
   - Check that your backend is running and accessible

3. **Build Failures:**
   - Check the build logs in Render dashboard
   - Ensure all dependencies are in package.json

4. **Environment Variables Not Working:**
   - Make sure variables start with `REACT_APP_`
   - Redeploy after changing environment variables

### Useful Commands:

```bash
# Test build locally
npm run build

# Start development server
npm start

# Check environment variables
echo $REACT_APP_API_BASE_URL
```

## File Structure After Deployment

```
frontend/
├── .env                    # Development environment
├── .env.production        # Production environment
├── render.yaml            # Render configuration
├── package.json           # Dependencies and scripts
├── build/                 # Production build (generated)
└── src/                   # Source code
```

## Next Steps

1. **Set up custom domain** (optional)
2. **Configure SSL** (automatic with Render)
3. **Set up monitoring** and logging
4. **Configure automatic deployments** from your main branch

Your frontend should now be successfully deployed on Render and connected to your backend!
