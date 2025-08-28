#!/usr/bin/env bash
# Build script for Render deployment

# Exit on error
set -o errexit

echo "🚀 Starting build process..."

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Show current migrations status
echo "🔍 Checking migrations status..."
python manage.py showmigrations --settings=kebede_pos.settings_production

# Run database migrations using production settings
echo "🗄️ Running database migrations..."
python manage.py migrate --settings=kebede_pos.settings_production

# Ensure all apps are migrated
echo "🔄 Running syncdb for any unmigrated apps..."
python manage.py migrate --run-syncdb --settings=kebede_pos.settings_production

# Fix database schema if needed
echo "🔧 Fixing database schema..."
python fix_database_schema.py || echo "⚠️ Schema fix failed, continuing..."

# Collect static files using production settings
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --settings=kebede_pos.settings_production

echo "✅ Build process completed successfully!"

# Create superuser if it doesn't exist (optional)
# echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'admin123') if not User.objects.filter(username='admin').exists() else None" | python manage.py shell --settings=kebede_pos.settings_production
