#!/usr/bin/env bash
# exit on error
set -o errexit

# Install system dependencies
apt-get update
apt-get install -y \
    libpq-dev \
    gcc \
    python3-dev \
    libffi-dev \
    libssl-dev

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate 