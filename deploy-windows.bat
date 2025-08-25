@echo off
echo 🚀 Kebede Butchery - Windows Deployment Script
echo ==============================================

echo.
echo [INFO] Starting deployment preparation...

REM Check if backend directory exists
if exist "backend" (
    echo [INFO] Preparing backend for Render deployment...
    
    REM Check if requirements.txt exists
    if not exist "backend\requirements.txt" (
        echo [ERROR] requirements.txt not found in backend directory!
        pause
        exit /b 1
    )
    
    REM Check if build.sh exists
    if not exist "backend\build.sh" (
        echo [ERROR] build.sh not found in backend directory!
        pause
        exit /b 1
    )
    
    echo [INFO] Backend files prepared successfully!
) else (
    echo [WARNING] Backend directory not found. Skipping backend preparation.
)

REM Check if frontend directory exists
if exist "frontend" (
    echo [INFO] Preparing frontend for Vercel deployment...
    
    REM Check if package.json exists
    if not exist "frontend\package.json" (
        echo [ERROR] package.json not found in frontend directory!
        pause
        exit /b 1
    )
    
    REM Check if vercel.json exists
    if not exist "frontend\vercel.json" (
        echo [ERROR] vercel.json not found in frontend directory!
        pause
        exit /b 1
    )
    
    echo [INFO] Frontend files prepared successfully!
) else (
    echo [WARNING] Frontend directory not found. Skipping frontend preparation.
)

echo.
echo [INFO] Deployment preparation completed!
echo.
echo 📋 Next Steps:
echo ===============
echo.
echo 1. 🐍 Backend (Render):
echo    - Go to https://dashboard.render.com
echo    - Create new Web Service
echo    - Connect your GitHub repository
echo    - Set build command: chmod +x build.sh ^&^& ./build.sh
echo    - Set start command: gunicorn kebede_pos.wsgi:application
echo    - Add environment variables (see DEPLOYMENT_GUIDE.md)
echo.
echo 2. ⚛️  Frontend (Vercel):
echo    - Go to https://vercel.com/dashboard
echo    - Create new project
echo    - Import your GitHub repository
echo    - Set root directory to 'frontend'
echo    - Deploy!
echo.
echo 3. 🔗 Update URLs:
echo    - Update frontend config with your Render backend URL
echo    - Update backend CORS settings with your Vercel frontend URL
echo.
echo 📖 For detailed instructions, see DEPLOYMENT_GUIDE.md
echo.
echo 🎉 Happy Deploying!
echo.
pause
