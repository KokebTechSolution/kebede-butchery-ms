#!/bin/bash

# Vercel-specific build script for React 19
echo "🚀 Starting Vercel build process for React 19..."

# Set environment variables
export NODE_ENV=production
export CI=false
export GENERATE_SOURCEMAP=false
export SKIP_PREFLIGHT_CHECK=true

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf build/
rm -rf node_modules/

# Install dependencies with specific flags for React 19
echo "📦 Installing dependencies for React 19..."
npm ci --only=production --legacy-peer-deps

# Check if critical dependencies are installed
if [ ! -d "node_modules/react" ] || [ ! -d "node_modules/react-dom" ]; then
    echo "❌ Critical React dependencies missing!"
    exit 1
fi

# Build for production
echo "🔨 Building for production with React 19..."
npm run build

# Check if build was successful
if [ -d "build" ] && [ -f "build/index.html" ]; then
    echo "✅ Build successful!"
    echo "📁 Build files created in ./build/"
    echo "🌐 Ready for Vercel deployment"
    
    # List build contents
    ls -la build/
    
    # Check build size
    du -sh build/
else
    echo "❌ Build failed!"
    echo "🔍 Checking for error logs..."
    
    # Check if there are any error logs
    if [ -f "npm-debug.log" ]; then
        echo "📋 npm debug log found:"
        tail -20 npm-debug.log
    fi
    
    exit 1
fi
