const express = require("express");
const router = express.Router();
const {
  getCategories,
  getCategoryBySlug,
  getSubcategories,
  searchCategories,
  seedCategories,
  getCategoryStats,
} = require("../controllers/categoryController");

// Public routes - no authentication required
router.get("/", getCategories);
router.get("/search", searchCategories);
router.get("/stats", getCategoryStats);
router.get("/:slug", getCategoryBySlug);
router.get("/:slug/subcategories", getSubcategories);

// Admin routes - authentication would be added later
router.post("/seed", seedCategories);

module.exports = router;
