#!/bin/bash

echo "🚀 Kebede Butchery - Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "manage.py" ] && [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory."
    exit 1
fi

print_status "Starting deployment preparation..."

# Backend preparation
if [ -d "backend" ]; then
    print_status "Preparing backend for Render deployment..."
    cd backend
    
    # Check if requirements.txt exists
    if [ ! -f "requirements.txt" ]; then
        print_error "requirements.txt not found in backend directory!"
        exit 1
    fi
    
    # Check if build.sh exists
    if [ ! -f "build.sh" ]; then
        print_error "build.sh not found in backend directory!"
        exit 1
    fi
    
    # Make build.sh executable
    chmod +x build.sh
    
    print_status "Backend files prepared successfully!"
    cd ..
else
    print_warning "Backend directory not found. Skipping backend preparation."
fi

# Frontend preparation
if [ -d "frontend" ]; then
    print_status "Preparing frontend for Vercel deployment..."
    cd frontend
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found in frontend directory!"
        exit 1
    fi
    
    # Check if vercel.json exists
    if [ ! -f "vercel.json" ]; then
        print_error "vercel.json not found in frontend directory!"
        exit 1
    fi
    
    print_status "Frontend files prepared successfully!"
    cd ..
else
    print_warning "Frontend directory not found. Skipping frontend preparation."
fi

print_status "Deployment preparation completed!"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. 🐍 Backend (Render):"
echo "   - Go to https://dashboard.render.com"
echo "   - Create new Web Service"
echo "   - Connect your GitHub repository"
echo "   - Set build command: chmod +x build.sh && ./build.sh"
echo "   - Set start command: gunicorn kebede_pos.wsgi:application"
echo "   - Add environment variables (see DEPLOYMENT_GUIDE.md)"
echo ""
echo "2. ⚛️  Frontend (Vercel):"
echo "   - Go to https://vercel.com/dashboard"
echo "   - Create new project"
echo "   - Import your GitHub repository"
echo "   - Set root directory to 'frontend'"
echo "   - Deploy!"
echo ""
echo "3. 🔗 Update URLs:"
echo "   - Update frontend config with your Render backend URL"
echo "   - Update backend CORS settings with your Vercel frontend URL"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT_GUIDE.md"
echo ""
echo "�� Happy Deploying!"
