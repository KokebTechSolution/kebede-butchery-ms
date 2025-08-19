#!/bin/bash
# Build script for Vercel deployment

echo "🚀 Starting Vercel build process..."

# Install dependencies
pip install -r requirements-vercel.txt

# Collect static files
python manage.py collectstatic --noinput --settings=kebede_pos.vercel_settings

# Run migrations
python manage.py migrate --settings=kebede_pos.vercel_settings

echo "✅ Build completed successfully!" 