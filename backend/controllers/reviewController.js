const Review = require('../models/Review');
const Job = require('../models/Job');
const User = require('../models/User');
const Service = require('../models/Service');
const mongoose = require('mongoose');

// @desc    Submit a new review
// @route   POST /api/reviews
// @access  Private (Customer only, after job completion)
const createReview = async (req, res) => {
  try {
    console.log('🔍 CREATE REVIEW - Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      jobId,
      ratings,
      title,
      comment,
      isRecommended,
      wouldHireAgain,
      completedOnTime,
      matchedDescription,
      images
    } = req.body;

    console.log('🔍 CREATE REVIEW - Individual Ratings Received:');
    console.log('  📊 Overall (manual):', ratings.overall);
    console.log('  📊 Quality:', ratings.quality);
    console.log('  📊 Communication:', ratings.communication);
    console.log('  📊 Punctuality:', ratings.punctuality);
    console.log('  📊 Professionalism:', ratings.professionalism);
    console.log('  📊 Value:', ratings.value);
    
    // Calculate the 6-category average
    const calculatedAverage = (ratings.overall + ratings.quality + ratings.communication + 
                             ratings.punctuality + ratings.professionalism + ratings.value) / 6;
    console.log('🧮 CALCULATED AVERAGE (all 6 categories):', calculatedAverage.toFixed(2));

    console.log('🔍 CREATE REVIEW - Parsed data:', {
      jobId,
      title: title ? title.substring(0, 50) + '...' : 'N/A',
      comment: comment ? comment.substring(0, 50) + '...' : 'N/A',
      isRecommended,
      wouldHireAgain,
      completedOnTime,
      matchedDescription
    });

    // Verify the job exists and belongs to the customer
    const job = await Job.findById(jobId).populate('vendor').populate('service').populate('customer');
    if (!job) {
      console.log('❌ CREATE REVIEW - Job not found:', jobId);
      return res.status(404).json({ message: 'Job not found' });
    }

    console.log('✅ CREATE REVIEW - Job found:', job._id, 'Customer:', job.customer.firebaseUid);

    // Check if current user is the customer (compare Firebase UID)
    const isCustomer = job.customer.firebaseUid === req.user.uid;
    
    if (!isCustomer) {
      console.log('❌ CREATE REVIEW - Not authorized. User UID:', req.user.uid, 'Job customer UID:', job.customer.firebaseUid);
      return res.status(403).json({ message: 'Not authorized to review this job' });
    }

    // Check if job is completed
    if (job.status !== 'completed') {
      console.log('❌ CREATE REVIEW - Job not completed. Status:', job.status);
      return res.status(400).json({ message: 'Can only review completed jobs' });
    }

    // Check if review already exists for this job
    const existingReview = await Review.findOne({ job: jobId });
    if (existingReview) {
      console.log('❌ CREATE REVIEW - Review already exists for job:', jobId);
      return res.status(400).json({ message: 'Review already exists for this job' });
    }

    // Validate ratings
    const ratingFields = ['overall', 'quality', 'communication', 'punctuality', 'professionalism', 'value'];
    for (const field of ratingFields) {
      if (!ratings[field] || ratings[field] < 1 || ratings[field] > 5) {
        console.log(`❌ CREATE REVIEW - Invalid ${field} rating:`, ratings[field]);
        return res.status(400).json({ message: `Invalid ${field} rating. Must be between 1 and 5` });
      }
    }

    console.log('✅ CREATE REVIEW - All validations passed. Creating review...');

    // Create the review
    const review = new Review({
      job: jobId,
      service: job.service._id,
      vendor: job.vendor._id,
      customer: job.customer._id,
      ratings,
      title,
      comment,
      isRecommended,
      wouldHireAgain,
      completedOnTime,
      matchedDescription,
      images: images || [],
      source: {
        platform: 'web',
      }
    });

    console.log('💾 CREATE REVIEW - Saving review to database...');
    const savedReview = await review.save();
    console.log('✅ CREATE REVIEW - Review saved successfully with ID:', savedReview._id);

    // Log what was actually saved
    console.log('🔍 CREATE REVIEW - Saved ratings in database:');
    console.log('  📊 Overall (manual):', savedReview.ratings.overall);
    console.log('  📊 Quality:', savedReview.ratings.quality);
    console.log('  📊 Communication:', savedReview.ratings.communication);
    console.log('  📊 Punctuality:', savedReview.ratings.punctuality);
    console.log('  📊 Professionalism:', savedReview.ratings.professionalism);
    console.log('  📊 Value:', savedReview.ratings.value);
    
    // Calculate what the average should be
    const savedCalculatedAverage = (savedReview.ratings.overall + savedReview.ratings.quality + 
                                   savedReview.ratings.communication + savedReview.ratings.punctuality + 
                                   savedReview.ratings.professionalism + savedReview.ratings.value) / 6;
    console.log('🧮 CALCULATED AVERAGE from saved data:', savedCalculatedAverage.toFixed(2));

    // Test the virtual method
    console.log('🔍 CREATE REVIEW - Virtual averageRating method result:', savedReview.averageRating);

    // Verify the review was actually saved
    const verifyReview = await Review.findById(savedReview._id);
    console.log('🔍 CREATE REVIEW - Verification query result:', verifyReview ? 'Found' : 'NOT FOUND');

    // Log vendor rating update process
    console.log('🔄 CREATE REVIEW - About to update vendor rating for vendor:', job.vendor._id);

    // Populate the review for response
    const populatedReview = await Review.findById(review._id)
      .populate('customer', 'firstName lastName avatar')
      .populate('vendor', 'firstName lastName')
      .populate('service', 'title');

    console.log('✅ CREATE REVIEW - Sending response with populated review');

    res.status(201).json({
      message: 'Review submitted successfully',
      review: populatedReview
    });

  } catch (error) {
    console.error('❌ CREATE REVIEW - Error creating review:', error);
    console.error('❌ CREATE REVIEW - Error stack:', error.stack);
    res.status(500).json({ message: 'Error submitting review', error: error.message });
  }
};

// @desc    Get reviews for a vendor
// @route   GET /api/reviews/vendor/:vendorId
// @access  Public
const getVendorReviews = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    // Validate vendor exists
    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Build sort criteria
    let sortCriteria = {};
    switch (sort) {
      case 'newest':
        sortCriteria = { createdAt: -1 };
        break;
      case 'oldest':
        sortCriteria = { createdAt: 1 };
        break;
      case 'highest_rating':
        sortCriteria = { 'ratings.overall': -1 };
        break;
      case 'lowest_rating':
        sortCriteria = { 'ratings.overall': 1 };
        break;
      case 'most_helpful':
        sortCriteria = { 'helpfulVotes.count': -1 };
        break;
      default:
        sortCriteria = { createdAt: -1 };
    }

    const skip = (page - 1) * parseInt(limit);

    // Get reviews with pagination
    const reviews = await Review.find({ 
      vendor: vendorId, 
      status: 'approved' 
    })
    .populate('customer', 'firstName lastName avatar')
    .populate('service', 'title category.name')
    .sort(sortCriteria)
    .skip(skip)
    .limit(parseInt(limit));

    // Get total count for pagination
    const totalReviews = await Review.countDocuments({ 
      vendor: vendorId, 
      status: 'approved' 
    });

    // Get review statistics
    const stats = await Review.getReviewStats(vendorId);

    res.json({
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReviews / parseInt(limit)),
        totalReviews,
        hasNext: skip + reviews.length < totalReviews,
        hasPrev: page > 1
      },
      stats
    });

  } catch (error) {
    console.error('Error fetching vendor reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

// @desc    Get reviews for a service
// @route   GET /api/reviews/service/:serviceId
// @access  Public
const getServiceReviews = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * parseInt(limit);

    const reviews = await Review.find({ 
      service: serviceId, 
      status: 'approved' 
    })
    .populate('customer', 'firstName lastName avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const totalReviews = await Review.countDocuments({ 
      service: serviceId, 
      status: 'approved' 
    });

    res.json({
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReviews / parseInt(limit)),
        totalReviews
      }
    });

  } catch (error) {
    console.error('Error fetching service reviews:', error);
    res.status(500).json({ message: 'Error fetching service reviews', error: error.message });
  }
};

// @desc    Get review for a specific job
// @route   GET /api/reviews/job/:jobId
// @access  Private (Customer or Vendor of the job)
const getJobReview = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Verify job exists and user is authorized
    const job = await Job.findById(jobId).populate('customer').populate('vendor');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if current user is the customer or vendor (compare Firebase UID)
    const isCustomer = job.customer.firebaseUid === req.user.uid;
    const isVendor = job.vendor.firebaseUid === req.user.uid;
    
    if (!isCustomer && !isVendor) {
      return res.status(403).json({ message: 'Not authorized to view this review' });
    }

    const review = await Review.findOne({ job: jobId })
      .populate('customer', 'firstName lastName avatar')
      .populate('vendor', 'firstName lastName')
      .populate('service', 'title');

    if (!review) {
      return res.status(404).json({ message: 'No review found for this job' });
    }

    res.json({ review });

  } catch (error) {
    console.error('Error fetching job review:', error);
    res.status(500).json({ message: 'Error fetching job review', error: error.message });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:reviewId
// @access  Private (Review author only)
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const {
      ratings,
      title,
      comment,
      isRecommended,
      wouldHireAgain,
      completedOnTime,
      matchedDescription,
      editReason
    } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Only the review author can update it
    if (review.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    // Add to edit history
    review.editHistory.push({
      previousRating: review.ratings.overall,
      previousComment: review.comment,
      editReason: editReason || 'Updated review'
    });

    // Update fields
    if (ratings) review.ratings = ratings;
    if (title) review.title = title;
    if (comment) review.comment = comment;
    if (typeof isRecommended === 'boolean') review.isRecommended = isRecommended;
    if (typeof wouldHireAgain === 'boolean') review.wouldHireAgain = wouldHireAgain;
    if (typeof completedOnTime === 'boolean') review.completedOnTime = completedOnTime;
    if (typeof matchedDescription === 'boolean') review.matchedDescription = matchedDescription;

    await review.save();

    const updatedReview = await Review.findById(reviewId)
      .populate('customer', 'firstName lastName avatar')
      .populate('vendor', 'firstName lastName')
      .populate('service', 'title');

    res.json({
      message: 'Review updated successfully',
      review: updatedReview
    });

  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Error updating review', error: error.message });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Private (Review author or admin)
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Only the review author or admin can delete it
    if (review.customer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await Review.findByIdAndDelete(reviewId);

    // Update vendor and service ratings after deletion
    await Review.updateVendorRating(review.vendor);
    await Review.updateServiceRating(review.service);

    res.json({ message: 'Review deleted successfully' });

  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
};

// @desc    Mark review as helpful
// @route   POST /api/reviews/:reviewId/helpful
// @access  Private
const markReviewHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user already voted
    const hasVoted = review.helpfulVotes.voters.some(
      voter => voter.user.toString() === req.user.id
    );

    if (hasVoted) {
      return res.status(400).json({ message: 'You have already marked this review as helpful' });
    }

    // Add vote
    review.helpfulVotes.voters.push({ user: req.user.id });
    review.helpfulVotes.count += 1;

    await review.save();

    res.json({
      message: 'Review marked as helpful',
      helpfulCount: review.helpfulVotes.count
    });

  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({ message: 'Error marking review as helpful', error: error.message });
  }
};

// @desc    Add vendor response to review
// @route   POST /api/reviews/:reviewId/response
// @access  Private (Vendor only)
const addVendorResponse = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { comment, isPublic = true } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Only the vendor who received the review can respond
    if (review.vendor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to respond to this review' });
    }

    // Check if vendor already responded
    if (review.vendorResponse.comment) {
      return res.status(400).json({ message: 'You have already responded to this review' });
    }

    review.vendorResponse = {
      comment,
      respondedAt: new Date(),
      isPublic
    };

    await review.save();

    const updatedReview = await Review.findById(reviewId)
      .populate('customer', 'firstName lastName avatar')
      .populate('vendor', 'firstName lastName')
      .populate('service', 'title');

    res.json({
      message: 'Response added successfully',
      review: updatedReview
    });

  } catch (error) {
    console.error('Error adding vendor response:', error);
    res.status(500).json({ message: 'Error adding vendor response', error: error.message });
  }
};

// @desc    Get review statistics for a vendor
// @route   GET /api/reviews/vendor/:vendorId/stats
// @access  Public
const getVendorReviewStats = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const stats = await Review.getReviewStats(vendorId);

    // Get rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { vendor: mongoose.Types.ObjectId(vendorId), status: 'approved' } },
      {
        $group: {
          _id: '$ratings.overall',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      stats,
      ratingDistribution
    });

  } catch (error) {
    console.error('Error fetching vendor review stats:', error);
    res.status(500).json({ message: 'Error fetching review statistics', error: error.message });
  }
};

module.exports = {
  createReview,
  getVendorReviews,
  getServiceReviews,
  getJobReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  addVendorResponse,
  getVendorReviewStats
}; 