const express = require('express');
const router = express.Router();
const {
  createReview,
  getVendorReviews,
  getServiceReviews,
  getJobReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  addVendorResponse,
  getVendorReviewStats
} = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/auth');

// @route   POST /api/reviews
// @desc    Submit a new review
// @access  Private (Customer only, after job completion)
router.post('/', verifyToken, createReview);

// @route   GET /api/reviews/vendor/:vendorId
// @desc    Get reviews for a vendor
// @access  Public
router.get('/vendor/:vendorId', getVendorReviews);

// @route   GET /api/reviews/vendor/:vendorId/stats
// @desc    Get review statistics for a vendor
// @access  Public
router.get('/vendor/:vendorId/stats', getVendorReviewStats);

// @route   GET /api/reviews/service/:serviceId
// @desc    Get reviews for a service
// @access  Public
router.get('/service/:serviceId', getServiceReviews);

// @route   GET /api/reviews/job/:jobId
// @desc    Get review for a specific job
// @access  Private (Customer or Vendor of the job)
router.get('/job/:jobId', verifyToken, getJobReview);

// @route   PUT /api/reviews/:reviewId
// @desc    Update a review
// @access  Private (Review author only)
router.put('/:reviewId', verifyToken, updateReview);

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete a review
// @access  Private (Review author or admin)
router.delete('/:reviewId', verifyToken, deleteReview);

// @route   POST /api/reviews/:reviewId/helpful
// @desc    Mark review as helpful
// @access  Private
router.post('/:reviewId/helpful', verifyToken, markReviewHelpful);

// @route   POST /api/reviews/:reviewId/response
// @desc    Add vendor response to review
// @access  Private (Vendor only)
router.post('/:reviewId/response', verifyToken, addVendorResponse);

module.exports = router; 