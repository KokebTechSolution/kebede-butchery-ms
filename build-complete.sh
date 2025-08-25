#!/bin/bash
# Complete build script for Render deployment

set -e

echo "🚀 Starting complete build process..."

# Change to backend directory
cd backend

echo "📦 Installing complete dependencies..."
pip install -r requirements-complete.txt

echo "🗂️ Collecting static files..."
python manage.py collectstatic --noinput

echo "🔄 Running database migrations..."
python manage.py migrate

echo "✅ Complete build completed successfully!"

cd ..
