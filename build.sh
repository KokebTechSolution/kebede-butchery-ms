#!/usr/bin/env bash
# Build script for Render deployment

# Exit on error
set -o errexit

echo "🚀 Starting build process..."

# Change to backend directory
cd backend

echo "📦 Installing dependencies..."
pip install -r requirements.txt

echo "🗂️ Collecting static files..."
python manage.py collectstatic --noinput

echo "🔄 Running database migrations..."
python manage.py migrate

echo "✅ Build completed successfully!"

# Go back to root
cd ..
