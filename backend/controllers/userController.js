const User = require('../models/User');
const admin = require('../config/firebaseAdmin');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/');
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + req.user.uid + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, firebaseUid, authProvider, role } = req.body;

    // Verify that the Firebase UID matches the token
    if (firebaseUid !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Check if user already exists
    let user = await User.findOne({ firebaseUid });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      firebaseUid,
      authProvider,
      role,
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Error fetching user profile' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (user) {
      // Update basic fields
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phoneNumber = req.body.phoneNumber !== undefined ? req.body.phoneNumber : user.phoneNumber;
      user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
      user.avatar = req.body.avatar !== undefined ? req.body.avatar : user.avatar;

      // Update address fields
      if (req.body.address) {
        user.address = {
          street: req.body.address.street !== undefined ? req.body.address.street : user.address.street,
          city: req.body.address.city !== undefined ? req.body.address.city : user.address.city,
          state: req.body.address.state !== undefined ? req.body.address.state : user.address.state,
          zipCode: req.body.address.zipCode !== undefined ? req.body.address.zipCode : user.address.zipCode,
          country: req.body.address.country !== undefined ? req.body.address.country : user.address.country,
        };
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        address: updatedUser.address,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        role: updatedUser.role,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

// Update user role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    // Validate role
    const validRoles = ['customer', 'vendor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Find and update user
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { role, updatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Error updating user role' });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/delete
// @access  Private
const deleteUser = async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    // Find user in MongoDB
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user from Firebase Auth
    await admin.auth().deleteUser(firebaseUid);

    // Delete user from MongoDB
    await User.deleteOne({ firebaseUid });

    // Note: Add any additional cleanup here (e.g., user's posts, comments, etc.)

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ error: 'Error deleting user account' });
  }
};

// @desc    Upload avatar image
// @route   POST /api/users/upload-avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Update user's avatar field in database
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { avatar: `/uploads/avatars/${req.file.filename}` },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Avatar uploaded successfully',
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Error uploading avatar' });
  }
};

module.exports = {
  registerUser,
  getUserProfile,
  updateUserProfile,
  updateUserRole,
  deleteUser,
  uploadAvatar,
  upload,
}; 