#!/bin/bash

# Migo Marketplace Application Startup Script
# This script starts both backend and frontend services

set -e  # Exit on any error

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to show success
show_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to show error
show_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to show info
show_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo -e "${CYAN}🚀 Starting Migo Marketplace Application${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    show_error "Please run this script from the root of the Migo Marketplace project"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    show_info "Installing root dependencies..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    show_info "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    show_info "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

show_success "All dependencies installed"

# Check environment files
if [ ! -f "backend/.env" ]; then
    show_error "Backend .env file not found. Please create backend/.env with your configuration"
    exit 1
fi

if [ ! -f "frontend/.env" ]; then
    show_error "Frontend .env file not found. Please create frontend/.env with your configuration"
    exit 1
fi

show_success "Environment files found"

# Start the application
show_info "Starting both backend and frontend services..."
echo ""
echo -e "${YELLOW}💡 The application will start on:${NC}"
echo -e "   ${CYAN}Backend:${NC}  http://localhost:5001"
echo -e "   ${CYAN}Frontend:${NC} http://localhost:3000"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both services${NC}"
echo ""

npm start 