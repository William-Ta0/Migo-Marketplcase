process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // It's often recommended to exit the process after an uncaught exception,
  // as the application might be in an inconsistent state.
  // Consider using a process manager like PM2 to automatically restart the app.
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Similar to uncaughtException, you might want to exit.
  // However, the nature of unhandled rejections can vary.
  // For critical errors, exiting is safer.
  process.exit(1);
});

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const morgan = require("morgan"); // HTTP request logger
const winston = require("winston");

// Load environment variables
dotenv.config();

// Initialize Firebase Admin (this will handle the initialization)
require("./config/firebaseAdmin");

// Initialize express app
const app = express();

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://migo-27d58.web.app', 'https://migo-27d58.firebaseapp.com']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Serve static files for uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check endpoint (before other routes)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Migo Marketplace API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.get("/", (req, res) => {
  res.json({ 
    message: 'Welcome to Migo Marketplace API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      services: '/api/services',
      users: '/api/users',
      jobs: '/api/jobs'
    }
  });
});

// API routes
app.use("/api/items", require("./routes/itemRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/vendor", require("./routes/vendorRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/jobs", require("./routes/jobRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Connect to MongoDB (for serverless, connect on each request if needed)
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    isConnected = true;
    logger.info("Connected to MongoDB");
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    logger.error('MongoDB connection error:', err);
    console.error('❌ MongoDB connection error:', err);
    throw err;
  }
};

// Middleware to ensure database connection
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

module.exports = app;
