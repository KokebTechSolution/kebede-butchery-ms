#!/bin/bash
# Final simple build script for Render deployment

set -e

echo "🚀 Starting final simple build process..."

# Change to backend directory
cd backend

echo "📦 Installing minimal dependencies..."
pip install setuptools==68.2.2
pip install -r requirements-ultra-minimal.txt

echo "🗂️ Collecting static files..."
python manage.py collectstatic --noinput

echo "🔄 Running database migrations..."
python manage.py migrate

echo "✅ Final simple build completed successfully!"

cd ..
