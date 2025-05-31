const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceById,
  searchServices,
  getServicesByCategory,
  getFeaturedServices,
  getServiceStats
} = require('../controllers/serviceController');

// Public routes - no authentication required
router.get('/', getServices);
router.get('/search', searchServices);
router.get('/featured', getFeaturedServices);
router.get('/stats', getServiceStats);
router.get('/category/:slug', getServicesByCategory);
router.get('/:id', getServiceById);

module.exports = router; 