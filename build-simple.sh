#!/bin/bash
# Simple build script for Render deployment

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
