const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  // Basic job information
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  
  // Service and vendor information
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Selected package information (if applicable)
  selectedPackage: {
    name: String,
    description: String,
    price: Number,
    features: [String],
    deliveryTime: Number,
  },
  
  // Pricing and payment
  pricing: {
    type: {
      type: String,
      enum: ['fixed', 'hourly', 'package', 'custom'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    estimatedTotal: Number,
    finalTotal: Number,
  },
  
  // Scheduling
  scheduling: {
    preferredDate: Date,
    confirmedDate: Date,
    estimatedStartTime: String, // "09:00"
    estimatedEndTime: String,   // "17:00"
    timezone: {
      type: String,
      default: 'America/New_York',
    },
    duration: {
      estimated: Number, // in hours
      actual: Number,
    }
  },
  
  // Location information
  location: {
    type: {
      type: String,
      enum: ['remote', 'onsite', 'both'],
      required: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      coordinates: {
        lat: Number,
        lng: Number,
      }
    },
    meetingLink: String, // For remote services
    specialInstructions: String,
  },
  
  // Job status and workflow
  status: {
    type: String,
    enum: [
      'pending',        // Initial request from customer
      'accepted',       // Vendor accepted the job
      'cancelled',      // Cancelled by either party
      'completed'       // Work completed and customer confirmed
    ],
    default: 'pending',
  },
  
  // Communication
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ['message', 'status_update', 'system'],
      default: 'message',
    }
  }],
  
  // Requirements and deliverables
  requirements: [String],
  deliverables: [String],
  completedDeliverables: [{
    name: String,
    description: String,
    files: [{
      name: String,
      url: String,
      type: String, // 'image', 'document', 'video', etc.
    }],
    completedAt: Date,
  }],
  
  // Urgency and priority
  urgency: {
    type: String,
    enum: ['normal', 'urgent', 'emergency'],
    default: 'normal',
  },
  priority: {
    type: Number,
    default: 1, // 1 = low, 2 = medium, 3 = high
  },
  
  // Files and attachments
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    }
  }],
  
  // Payment information
  payment: {
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'refunded', 'failed'],
      default: 'pending',
    },
    method: String,
    transactionId: String,
    paidAmount: {
      type: Number,
      default: 0,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    paymentDate: Date,
  },
  
  // Reviews and ratings
  review: {
    customer: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
      date: Date,
    },
    vendor: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
      date: Date,
    }
  },
  
  // Tracking and analytics
  tracking: {
    viewedByVendor: {
      type: Boolean,
      default: false,
    },
    viewedByCustomer: {
      type: Boolean,
      default: true,
    },
    lastViewedByVendor: Date,
    lastViewedByCustomer: Date,
    statusHistory: [{
      status: String,
      timestamp: Date,
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      reason: String,
    }],
  },
  
  // Cancellation information
  cancellation: {
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: String,
    cancelledAt: Date,
    refundIssued: {
      type: Boolean,
      default: false,
    },
    refundAmount: Number,
  },
  
  // Metadata
  metadata: {
    source: {
      type: String,
      default: 'web', // 'web', 'mobile', 'api'
    },
    platform: String,
    referrer: String,
    customFields: Object, // For any additional data
  }
}, {
  timestamps: true,
});

// Indexes for better performance
jobSchema.index({ customer: 1, status: 1 });
jobSchema.index({ vendor: 1, status: 1 });
jobSchema.index({ service: 1 });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ 'scheduling.preferredDate': 1 });
jobSchema.index({ 'payment.status': 1 });

// Virtual for job number/ID
jobSchema.virtual('jobNumber').get(function() {
  return `JOB-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Virtual for total messages count
jobSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Virtual for days since creation
jobSchema.virtual('daysSinceCreation').get(function() {
  return Math.ceil((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Ensure virtual fields are serialized
jobSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to track status changes
jobSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.tracking.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      changedBy: this.modifiedBy, // Set this in the controller
    });
  }
  next();
});

module.exports = mongoose.model('Job', jobSchema); 