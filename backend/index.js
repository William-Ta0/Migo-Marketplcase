const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const morgan = require("morgan"); // HTTP request logger
const logger = require("./config/logger"); // Import Winston logger

// Load environment variables
dotenv.config();

// Initialize Firebase Admin (this will handle the initialization)
require("./config/firebaseAdmin");

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5555;

// Morgan setup for HTTP request logging
// Log to console and file stream (via Winston)
const stream = {
  write: (message) => logger.info(message.trim()),
};
app.use(morgan("combined", { stream })); // 'combined' format is a standard Apache combined log output

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files for uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.get("/", (req, res) => {
  res.send("API is running...");
});

// API routes

app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/vendor', require('./routes/vendorRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));


// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(
    `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${
      req.method
    } - ${req.ip}`
  ); // Log error with Winston
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    logger.info("MongoDB Connected"); // Use Winston logger
    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`); // Use Winston logger
    });
  })
  .catch((err) => {
    logger.error(`Error connecting to MongoDB: ${err.message}`); // Use Winston logger
    process.exit(1);
  });
