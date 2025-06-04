const express = require("express");
const router = express.Router();
const {
  createService,
  getServices,
  getServiceById,
  searchServices,
  getServicesByCategory,
  getFeaturedServices,
  getServiceStats,
} = require("../controllers/serviceController");
const { verifyToken } = require("../middleware/auth");

// Protected routes - require authentication
router.post("/", verifyToken, createService);

// Public routes - no authentication required
router.get("/", getServices);
router.get("/search", searchServices);
router.get("/featured", getFeaturedServices);
router.get("/stats", getServiceStats);
router.get("/category/:slug", getServicesByCategory);
router.get("/:id", getServiceById);

module.exports = router;
