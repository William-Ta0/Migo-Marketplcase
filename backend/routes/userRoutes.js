const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  registerUser,
  getUserProfile,
  updateUserRole,
  updateUserProfile
} = require('../controllers/userController');

// Public routes
router.post('/register', verifyToken, registerUser);

// Protected routes
router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, updateUserProfile);
router.put('/role', verifyToken, updateUserRole);

module.exports = router; 