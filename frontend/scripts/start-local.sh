#!/bin/bash

# Start frontend with local backend
echo "Starting frontend with LOCAL backend (http://localhost:8000)"
echo "Make sure your Django backend is running on port 8000"
echo ""

# Set environment variables for local development
export REACT_APP_API_URL=http://localhost:8000
export NODE_ENV=development

# Start the React development server
npm start 