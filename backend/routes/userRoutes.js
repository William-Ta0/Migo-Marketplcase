const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  registerUser,
  getUserProfile,
  updateUserRole,
  updateUserProfile,
  deleteUser
} = require('../controllers/userController');

// Public routes
router.post('/register', verifyToken, registerUser);

// Protected routes
router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, updateUserProfile);
router.put('/role', verifyToken, updateUserRole);
router.delete('/delete', verifyToken, deleteUser);

module.exports = router; 