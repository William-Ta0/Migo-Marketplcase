#!/bin/bash

# Unset problematic HOST environment variable and set correct one
unset HOST
unset host_alias
unset CONDA_TOOLCHAIN_HOST

# Set proper HOST for React development server
export HOST=localhost
export PORT=3000

echo "🚀 Starting Migo Marketplace Frontend..."
echo "🌐 Frontend will be available at: http://localhost:3000"
echo "🔗 Backend API URL: http://localhost:5001/api"

npm start 