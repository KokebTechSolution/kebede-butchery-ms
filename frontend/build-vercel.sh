#!/bin/bash

# Vercel-specific build script
echo "🚀 Starting Vercel build process..."

# Set environment variables
export NODE_ENV=production
export CI=false
export GENERATE_SOURCEMAP=false

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf build/

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Build for production
echo "🔨 Building for production..."
npm run build

# Check if build was successful
if [ -d "build" ] && [ -f "build/index.html" ]; then
    echo "✅ Build successful!"
    echo "📁 Build files created in ./build/"
    echo "🌐 Ready for Vercel deployment"
    
    # List build contents
    ls -la build/
else
    echo "❌ Build failed!"
    exit 1
fi
