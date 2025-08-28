#!/bin/bash
# Render Build Script for Django + React

echo "🚀 Starting build process..."

# Install Node.js dependencies and build React
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

echo "🔨 Building React production bundle..."
npm run build

echo "✅ Frontend build complete!"

# Go back to project root
cd ..

# Install Python dependencies
echo "🐍 Installing backend dependencies..."
cd backend
pip install -r requirements.txt

echo "📊 Collecting static files..."
python manage.py collectstatic --noinput

echo "🎉 Build process complete!"
