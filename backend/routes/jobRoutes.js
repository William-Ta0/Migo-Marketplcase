const express = require('express');
const {
  createJob,
  getJobs,
  getJobById,
  updateJobStatus,
  addMessage,
  uploadFile,
  getJobStats,
  getJobStatusTransitions
} = require('../controllers/jobController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// @route   POST /api/jobs
// @desc    Create a new job/booking
// @access  Private
router.post('/', createJob);

// @route   GET /api/jobs/stats
// @desc    Get job statistics for dashboard
// @access  Private
router.get('/stats', getJobStats);

// @route   GET /api/jobs
// @desc    Get jobs for a user (customer or vendor)
// @access  Private
router.get('/', getJobs);

// @route   GET /api/jobs/:id
// @desc    Get a specific job by ID
// @access  Private
router.get('/:id', getJobById);

// @route   GET /api/jobs/:id/transitions
// @desc    Get available status transitions for a job
// @access  Private
router.get('/:id/transitions', getJobStatusTransitions);

// @route   PUT /api/jobs/:id/status
// @desc    Update job status
// @access  Private
router.put('/:id/status', updateJobStatus);

// @route   POST /api/jobs/:id/messages
// @desc    Add message to job
// @access  Private
router.post('/:id/messages', addMessage);

// @route   POST /api/jobs/:id/upload
// @desc    Upload file to job
// @access  Private
router.post('/:id/upload', uploadFile);

module.exports = router; 