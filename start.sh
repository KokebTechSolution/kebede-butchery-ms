#!/bin/bash
# Startup script for Render deployment

echo "🚀 Starting Kebede Butchery MS..."

# Go to backend directory
cd backend

# Run migrations
echo "📊 Running migrations..."
python manage.py migrate --noinput

# Create test users (only if they don't exist)
echo "👥 Creating initial users..."
python manage.py create_test_users

# Start the application
echo "🎯 Starting Gunicorn server..."
gunicorn kebede_pos.wsgi:application --bind 0.0.0.0:$PORT
