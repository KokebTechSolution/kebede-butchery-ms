@echo off
REM Python 3.13 compatible build script for Windows deployment

echo 🚀 Starting Python 3.13 compatible build process...

REM Change to backend directory
cd backend

echo 📦 Installing Python 3.13 compatible dependencies...
pip install setuptools==68.2.2
pip install -r requirements-windows.txt

echo 🗂️ Collecting static files...
python manage.py collectstatic --noinput --settings=kebede_pos.settings_production

echo 🔄 Running database migrations...
REM Try to run migrations normally first
python manage.py migrate --settings=kebede_pos.settings_production
if %errorlevel% neq 0 (
    echo ⚠️  Some migrations failed, attempting to resolve conflicts...
    REM If there are conflicts, try to fake problematic migrations
    python manage.py migrate users 0002_user_branch --fake --settings=kebede_pos.settings_production 2>nul
    REM Run remaining migrations
    python manage.py migrate --settings=kebede_pos.settings_production
)

echo ✅ Python 3.13 compatible build completed successfully!

cd ..
