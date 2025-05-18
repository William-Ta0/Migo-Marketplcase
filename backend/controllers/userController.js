const User = require('../models/User');
const admin = require('../config/firebaseAdmin');

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
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
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

module.exports = {
  registerUser,
  getUserProfile,
  updateUserProfile,
  updateUserRole,
}; 