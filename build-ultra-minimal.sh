#!/bin/bash
# Ultra-minimal build script for Render deployment

set -e

echo "🚀 Starting ultra-minimal build process..."

# Change to backend directory
cd backend

echo "📦 Installing ultra-minimal dependencies..."
pip install -r requirements-ultra-minimal.txt

echo "🔧 Temporarily fixing channels import issue..."
# Create a temporary __init__.py to avoid import errors
mkdir -p channels
echo "# Temporary channels module" > channels/__init__.py
echo "def get_channel_layer():" >> channels/__init__.py
echo "    return None" >> channels/__init__.py

echo "🗂️ Collecting static files..."
python manage.py collectstatic --noinput

echo "🔄 Running database migrations..."
python manage.py migrate

echo "✅ Ultra-minimal build completed successfully!"

cd ..
