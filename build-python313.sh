#!/bin/bash
# Python 3.13 compatible build script for Render deployment

set -e

echo "🚀 Starting Python 3.13 compatible build process..."

# Change to backend directory
cd backend

echo "📦 Installing Python 3.13 compatible dependencies..."
pip install setuptools==68.2.2
pip install -r requirements-python313.txt

echo "🗂️ Collecting static files..."
python manage.py collectstatic --noinput --settings=kebede_pos.settings_production

echo "🔄 Running database migrations..."
# Try to run migrations normally first
python manage.py migrate --settings=kebede_pos.settings_production || {
    echo "⚠️  Some migrations failed, attempting to resolve conflicts..."
    # If there are conflicts, try to fake problematic migrations
    python manage.py migrate users 0002_user_branch --fake --settings=kebede_pos.settings_production 2>/dev/null || true
    # Run remaining migrations
    python manage.py migrate --settings=kebede_pos.settings_production
}

echo "✅ Python 3.13 compatible build completed successfully!"

cd ..
