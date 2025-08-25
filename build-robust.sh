#!/bin/bash
# Robust build script for Render deployment

set -e  # Exit on any error

echo "🚀 Starting robust build process..."

# Upgrade pip first
echo "📦 Upgrading pip..."
python -m pip install --upgrade pip

# Install setuptools and wheel first
echo "🔧 Installing build tools..."
pip install setuptools==68.2.2 wheel==0.41.2

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
