const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  averagePrice: {
    min: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    }
  },
  isActive: {
    type: Boolean,
    default: true,
  }
});

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: '#3B82F6', // Default blue color
  },
  subcategories: [subcategorySchema],
  displayOrder: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  metadata: {
    totalServices: {
      type: Number,
      default: 0,
    },
    totalVendors: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    popularityScore: {
      type: Number,
      default: 0,
    }
  }
}, {
  timestamps: true,
});

// Create indexes for better performance
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1, displayOrder: 1 });
categorySchema.index({ 'subcategories.name': 1 });

module.exports = mongoose.model('ServiceCategory', categorySchema); 