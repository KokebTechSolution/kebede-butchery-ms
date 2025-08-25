#!/bin/bash
# Minimal build script for Render deployment

set -e

echo "🚀 Starting minimal build process..."

# Change to backend directory
cd backend

echo "📦 Installing minimal dependencies..."
pip install -r requirements-minimal.txt

echo "🗂️ Collecting static files..."
python manage.py collectstatic --noinput

echo "🔄 Running database migrations..."
python manage.py migrate

echo "✅ Minimal build completed successfully!"

cd ..
