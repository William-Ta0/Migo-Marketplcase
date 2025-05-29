const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    default: '',
  },
  address: {
    street: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      default: '',
    },
    zipCode: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: '',
    }
  },
  avatar: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500,
  },
  authProvider: {
    type: String,
    enum: ['email', 'google', 'apple', 'phone'],
    required: true,
  },
  role: {
    type: String,
    enum: ['customer', 'vendor', 'admin', null],
    default: null,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('User', userSchema); 