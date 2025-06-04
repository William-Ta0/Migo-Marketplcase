const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Core Review Information
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
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
  
  // Rating System (Multi-criteria)
  ratings: {
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    quality: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    communication: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    punctuality: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    professionalism: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    value: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    }
  },
  
  // Review Content
  title: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  
  // Review Metadata
  isRecommended: {
    type: Boolean,
    required: true,
  },
  wouldHireAgain: {
    type: Boolean,
    required: true,
  },
  
  // Service-specific feedback
  completedOnTime: {
    type: Boolean,
    required: true,
  },
  matchedDescription: {
    type: Boolean,
    required: true,
  },
  
  // Review Images (optional)
  images: [{
    url: String,
    alt: String,
    caption: String,
  }],
  
  // Review Status and Moderation
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'approved',
  },
  moderationNote: String,
  
  // Engagement Metrics
  helpfulVotes: {
    count: {
      type: Number,
      default: 0,
    },
    voters: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      votedAt: {
        type: Date,
        default: Date.now,
      }
    }]
  },
  
  // Response from Vendor (optional)
  vendorResponse: {
    comment: String,
    respondedAt: Date,
    isPublic: {
      type: Boolean,
      default: true,
    }
  },
  
  // Review Verification
  isVerified: {
    type: Boolean,
    default: true, // True if customer actually completed a job
  },
  verificationMethod: {
    type: String,
    enum: ['job_completion', 'payment_verification', 'manual'],
    default: 'job_completion',
  },
  
  // Review Analytics
  analytics: {
    viewCount: {
      type: Number,
      default: 0,
    },
    lastViewed: Date,
    reportCount: {
      type: Number,
      default: 0,
    },
    reportReasons: [String],
  },
  
  // Edit History
  editHistory: [{
    editedAt: {
      type: Date,
      default: Date.now,
    },
    previousRating: Number,
    previousComment: String,
    editReason: String,
  }],
  
  // Review Source
  source: {
    platform: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web',
    },
    location: {
      country: String,
      state: String,
      city: String,
    }
  }
}, {
  timestamps: true,
});

// Indexes for better performance
reviewSchema.index({ vendor: 1, createdAt: -1 });
reviewSchema.index({ service: 1, createdAt: -1 });
reviewSchema.index({ customer: 1, createdAt: -1 });
reviewSchema.index({ job: 1 }, { unique: true }); // One review per job
reviewSchema.index({ 'ratings.overall': -1 });
reviewSchema.index({ status: 1, createdAt: -1 });

// Virtual for average rating calculation
reviewSchema.virtual('averageRating').get(function() {
  const { overall, quality, communication, punctuality, professionalism, value } = this.ratings;
  return ((overall + quality + communication + punctuality + professionalism + value) / 6).toFixed(1);
});

// Pre-save middleware to update related models
reviewSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Update vendor's overall rating
      await this.constructor.updateVendorRating(this.vendor);
      
      // Update service's rating
      await this.constructor.updateServiceRating(this.service);
      
      // Mark job as reviewed
      const Job = mongoose.model('Job');
      await Job.findByIdAndUpdate(this.job, {
        'review.customer.rating': this.ratings.overall,
        'review.customer.comment': this.comment,
        'review.customer.date': new Date(),
      });
      
    } catch (error) {
      console.error('Error updating ratings:', error);
    }
  }
  next();
});

// Static method to update vendor rating
reviewSchema.statics.updateVendorRating = async function(vendorId) {
  console.log('🔄 UPDATE VENDOR RATING - Starting for vendor:', vendorId);
  
  const reviews = await this.find({ 
    vendor: vendorId, 
    status: 'approved' 
  });
  
  console.log(`📊 UPDATE VENDOR RATING - Found ${reviews.length} approved reviews`);
  
  if (reviews.length > 0) {
    console.log('🔍 UPDATE VENDOR RATING - Individual review calculations:');
    
    // Use calculated average instead of manual overall rating
    const totalRating = reviews.reduce((sum, review, index) => {
      const { overall, quality, communication, punctuality, professionalism, value } = review.ratings;
      const calculatedAverage = (overall + quality + communication + punctuality + professionalism + value) / 6;
      
      console.log(`  Review ${index + 1}: [${overall}, ${quality}, ${communication}, ${punctuality}, ${professionalism}, ${value}] = ${calculatedAverage.toFixed(2)}`);
      
      return sum + calculatedAverage;
    }, 0);
    
    const averageRating = (totalRating / reviews.length).toFixed(1);
    
    console.log(`🧮 UPDATE VENDOR RATING - Total rating sum: ${totalRating.toFixed(2)}`);
    console.log(`🧮 UPDATE VENDOR RATING - Number of reviews: ${reviews.length}`);
    console.log(`🧮 UPDATE VENDOR RATING - Final average: ${averageRating}`);
    
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(vendorId, {
      'vendorInfo.rating.average': parseFloat(averageRating),
      'vendorInfo.rating.count': reviews.length,
    });
    
    console.log(`✅ UPDATE VENDOR RATING - Updated vendor ${vendorId} with rating ${averageRating}`);
    
    // Verify the update
    const updatedVendor = await User.findById(vendorId).select('vendorInfo.rating');
    console.log(`🔍 UPDATE VENDOR RATING - Verification - Vendor rating in DB: ${updatedVendor.vendorInfo.rating.average}`);
  } else {
    console.log('❌ UPDATE VENDOR RATING - No approved reviews found for vendor:', vendorId);
  }
};

// Static method to update service rating
reviewSchema.statics.updateServiceRating = async function(serviceId) {
  const reviews = await this.find({ 
    service: serviceId, 
    status: 'approved' 
  });
  
  if (reviews.length > 0) {
    // Use calculated average instead of manual overall rating
    const totalRating = reviews.reduce((sum, review) => {
      const { overall, quality, communication, punctuality, professionalism, value } = review.ratings;
      const calculatedAverage = (overall + quality + communication + punctuality + professionalism + value) / 6;
      return sum + calculatedAverage;
    }, 0);
    const averageRating = (totalRating / reviews.length).toFixed(1);
    
    const Service = mongoose.model('Service');
    await Service.findByIdAndUpdate(serviceId, {
      'stats.rating.average': parseFloat(averageRating),
      'stats.rating.count': reviews.length,
    });
  }
};

// Static method to get review statistics
reviewSchema.statics.getReviewStats = async function(vendorId) {
  const stats = await this.aggregate([
    { $match: { vendor: mongoose.Types.ObjectId(vendorId), status: 'approved' } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        // Calculate average of all 6 rating categories
        averageOverall: { 
          $avg: { 
            $divide: [
              { 
                $add: [
                  '$ratings.overall', 
                  '$ratings.quality', 
                  '$ratings.communication', 
                  '$ratings.punctuality', 
                  '$ratings.professionalism', 
                  '$ratings.value'
                ] 
              }, 
              6
            ] 
          } 
        },
        averageQuality: { $avg: '$ratings.quality' },
        averageCommunication: { $avg: '$ratings.communication' },
        averagePunctuality: { $avg: '$ratings.punctuality' },
        averageProfessionalism: { $avg: '$ratings.professionalism' },
        averageValue: { $avg: '$ratings.value' },
        recommendationRate: { 
          $avg: { $cond: ['$isRecommended', 1, 0] } 
        },
        onTimeRate: { 
          $avg: { $cond: ['$completedOnTime', 1, 0] } 
        },
      }
    }
  ]);
  
  return stats[0] || {
    totalReviews: 0,
    averageOverall: 0,
    averageQuality: 0,
    averageCommunication: 0,
    averagePunctuality: 0,
    averageProfessionalism: 0,
    averageValue: 0,
    recommendationRate: 0,
    onTimeRate: 0,
  };
};

module.exports = mongoose.model('Review', reviewSchema); 