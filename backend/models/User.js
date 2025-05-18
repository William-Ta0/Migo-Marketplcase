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
  authProvider: {
    type: String,
    enum: ['email', 'google'],
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