# 🚀 Deployment Guide - Kebede Butchery MS

## Overview
This guide will help you deploy the frontend-only version of the Kebede Butchery Management System to Netlify for free testing.

## ✅ What's Changed

### Backend Removal
- ✅ Removed Django backend dependency
- ✅ Created mock data service
- ✅ Added mock API endpoints
- ✅ Automatic switching between real API (localhost) and mock data (production)

### Frontend Standalone
- ✅ All API calls now work with mock data in production
- ✅ No backend server required
- ✅ Ready for static hosting

## 🎯 Test Credentials

Use these credentials to test the application:

| Role | Username | Password |
|------|----------|----------|
| Waiter | waiter1 | 12345678 |
| Bartender | bartender1 | 12345678 |
| Meat Counter | meat1 | 12345678 |
| Cashier | cashier1 | 12345678 |
| Manager | manager1 | 12345678 |
| Owner | owner1 | 12345678 |

## 🚀 Deploy to Netlify

### Option 1: Deploy via Netlify UI (Recommended)

1. **Go to Netlify**
   - Visit [netlify.com](https://netlify.com)
   - Sign up/Login with GitHub

2. **Connect Repository**
   - Click "New site from Git"
   - Choose your GitHub repository
   - Select the `frontend` folder as the base directory

3. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `build`
   - Click "Deploy site"

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Deploy**
   ```bash
   cd frontend
   netlify deploy --prod
   ```

### Option 3: Drag & Drop

1. **Build the Project**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Deploy**
   - Go to [netlify.com](https://netlify.com)
   - Drag the `build` folder to the deploy area

## 🔧 Local Development

### Development Mode (with Backend)
```bash
# Terminal 1: Start Django Backend
cd backend
python manage.py runserver

# Terminal 2: Start React Frontend
cd frontend
npm start
```

### Standalone Mode (Mock Data)
```bash
cd frontend
npm start
# Will use mock data automatically
```

## 📁 Project Structure

```
kebede-butchery-ms/
├── frontend/                 # React App (Ready for deployment)
│   ├── src/
│   │   ├── api/
│   │   │   ├── axiosInstance.js    # Auto-switches to mock data
│   │   │   ├── mockData.js         # Mock data
│   │   │   └── mockApiService.js   # Mock API service
│   │   └── ...
│   ├── package.json
│   ├── netlify.toml
│   └── build/               # Production build
└── backend/                 # Django Backend (Optional)
    └── ...
```

## 🎯 Features Available in Mock Mode

### ✅ Working Features
- User authentication (with mock users)
- Role-based dashboards
- Order management
- Table management
- Product catalog
- User profiles
- Statistics and reports
- Date filtering
- Order status updates

### ⚠️ Limitations
- Data is not persistent (resets on page refresh)
- No real database operations
- Mock data only

## 🔄 Switching Between Modes

### Development Mode (Real API)
- Run on `localhost:3000`
- Connects to Django backend on `localhost:8000`
- Real database operations

### Production Mode (Mock Data)
- Deployed on Netlify
- Uses mock data automatically
- No backend required

## 🛠️ Customization

### Adding More Mock Data
Edit `frontend/src/api/mockData.js`:
```javascript
export const mockUsers = [
  // Add more users here
];

export const mockOrders = [
  // Add more orders here
];
```

### Adding New API Endpoints
Edit `frontend/src/api/mockApiService.js`:
```javascript
// Add new endpoint handling
if (path.includes('your-new-endpoint/')) {
  data = await mockApi.yourNewFunction();
}
```

## 🎉 Success!

Once deployed, your app will be available at:
`https://your-site-name.netlify.app`

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all dependencies are installed
3. Ensure the build process completes successfully
4. Check Netlify deployment logs

---

**Happy Testing! 🚀** 