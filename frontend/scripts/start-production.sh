#!/bin/bash

# Start frontend with production backend
echo "Starting frontend with PRODUCTION backend (https://kebede-butchery-ms.onrender.com)"
echo ""

# Set environment variables for production
export REACT_APP_API_URL=https://kebede-butchery-ms.onrender.com
export NODE_ENV=production

# Start the React development server
npm start 