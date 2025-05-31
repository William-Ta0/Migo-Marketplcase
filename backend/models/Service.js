const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  shortDescription: {
    type: String,
    required: true,
    maxlength: 200,
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    }
  },
  subcategory: {
    name: {
      type: String,
      required: true,
    },
    description: String,
  },
  pricing: {
    type: {
      type: String,
      enum: ['fixed', 'hourly', 'package', 'custom'],
      required: true,
    },
    amount: {
      type: Number,
      required: function() {
        return this.pricing.type === 'fixed' || this.pricing.type === 'hourly';
      },
    },
    currency: {
      type: String,
      default: 'USD',
    },
    packages: [{
      name: String,
      description: String,
      price: Number,
      features: [String],
      deliveryTime: Number, // in days
    }],
    customNote: {
      type: String,
      maxlength: 500,
    }
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false,
    }
  }],
  location: {
    type: {
      type: String,
      enum: ['remote', 'onsite', 'both'],
      default: 'both',
    },
    serviceArea: {
      radius: {
        type: Number,
        default: 25, // miles
      },
      cities: [String],
      states: [String],
      countries: [String],
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    }
  },
  availability: {
    schedule: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      },
      isAvailable: {
        type: Boolean,
        default: true,
      },
      hours: {
        start: String, // "09:00"
        end: String,   // "17:00"
      }
    }],
    timezone: {
      type: String,
      default: 'America/New_York',
    },
    leadTime: {
      type: Number,
      default: 1, // days
    }
  },
  features: [String],
  tags: [String],
  requirements: [String],
  deliverables: [String],
  estimatedDuration: {
    min: Number,
    max: Number,
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks', 'months'],
      default: 'hours',
    }
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isPromoted: {
    type: Boolean,
    default: false,
  },
  stats: {
    views: {
      type: Number,
      default: 0,
    },
    inquiries: {
      type: Number,
      default: 0,
    },
    bookings: {
      type: Number,
      default: 0,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      }
    }
  }
}, {
  timestamps: true,
});

// Create indexes for better search performance
serviceSchema.index({ title: 'text', description: 'text', tags: 'text' });
serviceSchema.index({ 'category.slug': 1, 'subcategory.name': 1 });
serviceSchema.index({ vendor: 1 });
serviceSchema.index({ isActive: 1, isPromoted: -1, 'stats.rating.average': -1 });
serviceSchema.index({ 'location.serviceArea.cities': 1 });
serviceSchema.index({ 'pricing.amount': 1 });

// Virtual for getting primary image
serviceSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0] || null;
});

// Virtual for rating display
serviceSchema.virtual('displayRating').get(function() {
  return Math.round(this.stats.rating.average * 10) / 10;
});

module.exports = mongoose.model('Service', serviceSchema); 