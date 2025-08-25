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
python manage.py collectstatic --noinput

echo "🔄 Running database migrations..."
python manage.py migrate

echo "✅ Python 3.13 compatible build completed successfully!"

cd ..
