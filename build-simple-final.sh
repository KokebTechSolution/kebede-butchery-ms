#!/bin/bash
# Final simple build script for Render deployment

set -e

echo "🚀 Starting final simple build process..."

# Change to backend directory
cd backend

echo "📦 Installing minimal dependencies..."
pip install Django==4.2.7
pip install djangorestframework==3.14.0
pip install django-cors-headers==4.3.1
pip install djangorestframework-simplejwt==5.3.0
pip install psycopg2-binary==2.9.9
pip install gunicorn==21.2.0
pip install whitenoise==6.6.0
pip install python-decouple==3.8
pip install dj-database-url==2.1.0

echo "🗂️ Collecting static files..."
python manage.py collectstatic --noinput

echo "🔄 Running database migrations..."
python manage.py migrate

echo "✅ Final simple build completed successfully!"

cd ..
