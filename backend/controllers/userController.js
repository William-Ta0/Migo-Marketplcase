const User = require('../models/userModel');
const admin = require('../config/firebaseAdmin');

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, firebaseUid } = req.body;

    if (!name || !email || !firebaseUid) {
      res.status(400);
      throw new Error('Please provide all required fields');
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Create user in MongoDB
    const user = await User.create({
      name,
      email,
      firebaseUid,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    res.status(404);
    throw new Error(error.message);
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

module.exports = {
  registerUser,
  getUserProfile,
  updateUserProfile,
}; 