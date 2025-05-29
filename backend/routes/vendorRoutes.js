const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  getServiceCategories,
  updateVendorSkills,
  uploadVerificationDocuments,
  completeOnboarding,
  getVendorProfile,
  upload
} = require('../controllers/vendorController');

// Public routes
router.get('/categories', getServiceCategories);

// Protected vendor routes
router.get('/profile', verifyToken, getVendorProfile);
router.put('/skills', verifyToken, updateVendorSkills);
router.post('/verification/upload', verifyToken, upload.fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'businessLicense', maxCount: 1 }
]), uploadVerificationDocuments);
router.put('/onboarding/complete', verifyToken, completeOnboarding);

module.exports = router; 