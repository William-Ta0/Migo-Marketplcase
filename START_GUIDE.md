# 🚀 Migo Marketplace Start Guide

This guide explains how to start and use your Migo Marketplace application.

## ✅ Problems Fixed

1. **Root package.json** - Added proper scripts and dependencies
2. **Missing dotenv** - Installed in root directory
3. **Start commands** - Created multiple ways to start the application
4. **Dependencies** - Added concurrently for running both services

## 🎯 How to Start the Application

### Option 1: NPM Scripts (Recommended)

```bash
# Start both backend and frontend together
npm start

# Or start them separately
npm run backend    # Starts only backend on port 5000
npm run frontend   # Starts only frontend on port 3000

# Development mode (with auto-restart)
npm run dev
```

### Option 2: Using the Start Script

```bash
# Use the automated start script
./start-app.sh
```

### Option 3: Manual Start

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

## 🌐 Application URLs

Once started, your application will be available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- ✅ **Node.js** (v16 or later)
- ✅ **npm** (v8 or later)
- ✅ **MongoDB** connection (Atlas or local)
- ✅ **Environment files** configured

## 🔧 Environment Setup

### Backend Environment (.env)

Located in `backend/.env`, should contain:

```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### Frontend Environment (.env)

Located in `frontend/.env`, should contain:

```env
REACT_APP_API_URL=http://localhost:5001
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Test Options

```bash
npm run test:backend     # Backend tests only
npm run test:frontend    # Frontend tests only
npm run test:coverage    # With coverage report
```

### Setup Test Environment

```bash
./setup-tests.sh
```

## 🚨 Troubleshooting

### Common Issues

1. **"npm start" not found**

   - ✅ **Fixed** - Added proper scripts to root package.json

2. **"dotenv not found"**

   - ✅ **Fixed** - Installed dotenv in root directory

3. **"start-frontend.sh not found"**

   - ✅ **Fixed** - Frontend start script is in `frontend/start-frontend.sh`
   - Use `npm run frontend` instead from root

4. **Port conflicts**

   ```bash
   # Kill existing processes
   lsof -ti:3000 | xargs kill -9  # Frontend
   lsof -ti:5001 | xargs kill -9  # Backend
   ```

5. **Dependencies missing**
   ```bash
   # Install all dependencies
   npm run install:all
   ```

### Health Check Commands

```bash
# Check if backend is running
curl http://localhost:5001/api/health

# Check if frontend is accessible
curl http://localhost:3000
```

## 📁 Project Structure

```
migo-marketplace/
├── backend/           # Express.js API server
├── frontend/          # React application
├── tests/            # Comprehensive test suite
├── package.json      # Root scripts and dependencies
├── start-app.sh      # Automated start script
└── run-tests.js      # Test runner
```

## 🎉 Quick Start Summary

1. **Install dependencies**: `npm install`
2. **Start application**: `npm start`
3. **Access frontend**: http://localhost:3000
4. **Access backend**: http://localhost:5001

That's it! Your Migo Marketplace should now be running smoothly.

---

💡 **Pro Tip**: Use `npm run dev` for development mode with hot reloading!
