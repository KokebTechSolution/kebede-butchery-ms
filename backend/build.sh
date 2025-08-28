#!/usr/bin/env bash
# Build script for Render deployment

# Exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Collect static files using production settings
python manage.py collectstatic --noinput --settings=kebede_pos.settings_production

# Run database migrations using production settings
python manage.py migrate --settings=kebede_pos.settings_production

# Create superuser if it doesn't exist (optional)
# echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'admin123') if not User.objects.filter(username='admin').exists() else None" | python manage.py shell --settings=kebede_pos.settings_production
