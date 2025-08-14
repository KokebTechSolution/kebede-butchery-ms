#!/bin/bash

# Build script for Kebede Butchery Frontend

echo "🚀 Starting build process..."

# Set environment
export NODE_ENV=production
export GENERATE_SOURCEMAP=false

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf build/

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build for production
echo "🔨 Building for production..."
npm run build

# Check if build was successful
if [ -d "build" ]; then
    echo "✅ Build successful!"
    echo "📁 Build files created in ./build/"
    echo "🌐 Ready for deployment"
else
    echo "❌ Build failed!"
    exit 1
fi 