const express = require("express");
const router = express.Router();
const {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} = require("../controllers/itemController");
const { protect } = require("../middleware/authMiddleware");

// Public route for getting all items
router.get("/", getItems);

// Protected routes
router.post("/", protect, createItem);
router
  .route("/:id")
  .get(protect, getItemById)
  .put(protect, updateItem)
  .delete(protect, deleteItem);

module.exports = router;
