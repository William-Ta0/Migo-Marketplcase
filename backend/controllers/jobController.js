const Job = require('../models/Job');
const Service = require('../models/Service');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/jobs/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// @desc    Create a new job/booking
// @route   POST /api/jobs
// @access  Private
const createJob = async (req, res) => {
  try {
    const {
      serviceId,
      vendorId,
      message,
      preferredDate,
      urgency,
      selectedPackage,
      location
    } = req.body;

    const customerId = req.user.uid;

    // Validate the service exists and is active
    const service = await Service.findById(serviceId).populate('vendor');
    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or inactive'
      });
    }

    // Verify vendor owns the service
    if (service.vendor._id.toString() !== vendorId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vendor for this service'
      });
    }

    // Get customer information
    const customer = await User.findOne({ firebaseUid: customerId });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Calculate pricing
    let pricing = {
      type: service.pricing.type,
      currency: service.pricing.currency || 'USD'
    };

    if (selectedPackage) {
      const packageInfo = service.pricing.packages.find(pkg => pkg.name === selectedPackage.name);
      if (!packageInfo) {
        return res.status(400).json({
          success: false,
          message: 'Selected package not found'
        });
      }
      pricing.amount = packageInfo.price;
      pricing.estimatedTotal = packageInfo.price;
    } else {
      pricing.amount = service.pricing.amount || 0;
      pricing.estimatedTotal = service.pricing.amount || 0;
    }

    // Create the job
    const job = new Job({
      title: service.title,
      description: message,
      service: serviceId,
      vendor: service.vendor._id,
      customer: customer._id,
      selectedPackage: selectedPackage,
      pricing: pricing,
      scheduling: {
        preferredDate: preferredDate ? new Date(preferredDate) : null,
      },
      location: {
        type: service.location.type,
        address: location?.address || service.location.address,
        specialInstructions: location?.specialInstructions,
      },
      urgency: urgency || 'normal',
      requirements: service.requirements || [],
      deliverables: service.deliverables || [],
      messages: [{
        sender: customer._id,
        message: message,
        type: 'message'
      }],
      tracking: {
        viewedByCustomer: true,
        lastViewedByCustomer: new Date(),
        statusHistory: [{
          status: 'pending',
          timestamp: new Date(),
          changedBy: customer._id,
        }]
      }
    });

    await job.save();

    // Update service statistics
    await Service.findByIdAndUpdate(serviceId, {
      $inc: { 'stats.inquiries': 1 }
    });

    // Populate the created job for response
    const populatedJob = await Job.findById(job._id)
      .populate('service', 'title images')
      .populate('vendor', 'name email avatar')
      .populate('customer', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Booking request sent successfully',
      data: populatedJob
    });

  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
};

// @desc    Get jobs for a user (customer or vendor)
// @route   GET /api/jobs
// @access  Private
const getJobs = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { 
      status, 
      role = 'customer', 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Find user
    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build query based on role
    let query = {};
    if (role === 'customer') {
      query.customer = user._id;
    } else if (role === 'vendor') {
      query.vendor = user._id;
    } else {
      // For admin, return all jobs (implement admin check here)
      query = {};
    }

    // Add status filter if provided
    if (status && status !== 'all') {
      if (status.includes(',')) {
        query.status = { $in: status.split(',') };
      } else {
        query.status = status;
      }
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const jobs = await Job.find(query)
      .populate('service', 'title images category')
      .populate('vendor', 'name email avatar address')
      .populate('customer', 'name email avatar address')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count
    const total = await Job.countDocuments(query);

    // Update last viewed timestamp
    if (role === 'vendor') {
      await Job.updateMany(
        { ...query, 'tracking.viewedByVendor': false },
        { 
          'tracking.viewedByVendor': true,
          'tracking.lastViewedByVendor': new Date()
        }
      );
    }

    res.json({
      success: true,
      data: jobs,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
};

// @desc    Get a specific job by ID
// @route   GET /api/jobs/:id
// @access  Private
const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    // Find user
    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find job and populate related data
    const job = await Job.findById(id)
      .populate('service', 'title description images category pricing location')
      .populate('vendor', 'name email avatar address bio')
      .populate('customer', 'name email avatar address')
      .populate('messages.sender', 'name avatar');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user has access to this job
    const isCustomer = job.customer._id.toString() === user._id.toString();
    const isVendor = job.vendor._id.toString() === user._id.toString();
    
    if (!isCustomer && !isVendor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update view tracking
    const updateFields = {};
    if (isVendor) {
      updateFields['tracking.viewedByVendor'] = true;
      updateFields['tracking.lastViewedByVendor'] = new Date();
    } else if (isCustomer) {
      updateFields['tracking.viewedByCustomer'] = true;
      updateFields['tracking.lastViewedByCustomer'] = new Date();
    }

    if (Object.keys(updateFields).length > 0) {
      await Job.findByIdAndUpdate(id, updateFields);
    }

    res.json({
      success: true,
      data: job
    });

  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job details',
      error: error.message
    });
  }
};

// @desc    Update job status
// @route   PUT /api/jobs/:id/status
// @access  Private
const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const userId = req.user.uid;

    // Find user
    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find job
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check permissions
    const isCustomer = job.customer.toString() === user._id.toString();
    const isVendor = job.vendor.toString() === user._id.toString();
    
    if (!isCustomer && !isVendor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Validate status transitions
    const allowedTransitions = {
      'pending': ['reviewing', 'accepted', 'rejected', 'cancelled'],
      'reviewing': ['quoted', 'accepted', 'rejected', 'cancelled'],
      'quoted': ['accepted', 'rejected', 'cancelled'],
      'accepted': ['confirmed', 'cancelled'],
      'confirmed': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': ['delivered', 'disputed'],
      'delivered': ['closed'],
      'cancelled': [],
      'disputed': ['closed'],
      'closed': []
    };

    if (!allowedTransitions[job.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${job.status} to ${status}`
      });
    }

    // Update job status
    job.status = status;
    job.modifiedBy = user._id; // For pre-save middleware

    // Add system message for status change
    job.messages.push({
      sender: user._id,
      message: `Job status changed to ${status}${reason ? `: ${reason}` : ''}`,
      type: 'status_update'
    });

    await job.save();

    // Update service statistics if needed
    if (status === 'completed') {
      await Service.findByIdAndUpdate(job.service, {
        $inc: { 'stats.bookings': 1 }
      });
    }

    res.json({
      success: true,
      message: 'Job status updated successfully',
      data: { status: job.status }
    });

  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job status',
      error: error.message
    });
  }
};

// @desc    Add message to job
// @route   POST /api/jobs/:id/messages
// @access  Private
const addMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.uid;

    // Find user
    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find job
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check permissions
    const isCustomer = job.customer.toString() === user._id.toString();
    const isVendor = job.vendor.toString() === user._id.toString();
    
    if (!isCustomer && !isVendor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Add message
    job.messages.push({
      sender: user._id,
      message: message,
      type: 'message'
    });

    await job.save();

    // Get the populated message
    const updatedJob = await Job.findById(id)
      .populate('messages.sender', 'name avatar');
    
    const newMessage = updatedJob.messages[updatedJob.messages.length - 1];

    res.json({
      success: true,
      message: 'Message added successfully',
      data: newMessage
    });

  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add message',
      error: error.message
    });
  }
};

// @desc    Upload file to job
// @route   POST /api/jobs/:id/upload
// @access  Private
const uploadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    // Handle file upload
    upload.single('file')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'File upload failed',
          error: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided'
        });
      }

      // Find user
      const user = await User.findOne({ firebaseUid: userId });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Find job
      const job = await Job.findById(id);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      // Check permissions
      const isCustomer = job.customer.toString() === user._id.toString();
      const isVendor = job.vendor.toString() === user._id.toString();
      
      if (!isCustomer && !isVendor) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Add file to job attachments
      const attachment = {
        name: req.file.originalname,
        url: `/uploads/jobs/${req.file.filename}`,
        type: req.file.mimetype,
        uploadedBy: user._id
      };

      job.attachments.push(attachment);
      await job.save();

      res.json({
        success: true,
        message: 'File uploaded successfully',
        data: attachment
      });
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message
    });
  }
};

// @desc    Get job statistics for dashboard
// @route   GET /api/jobs/stats
// @access  Private
const getJobStats = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { role = 'customer' } = req.query;

    // Find user
    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build query based on role
    let matchQuery = {};
    if (role === 'customer') {
      matchQuery.customer = user._id;
    } else if (role === 'vendor') {
      matchQuery.vendor = user._id;
    }

    // Get statistics
    const stats = await Job.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$pricing.estimatedTotal' }
        }
      }
    ]);

    // Get recent jobs
    const recentJobs = await Job.find(matchQuery)
      .populate('service', 'title')
      .populate(role === 'customer' ? 'vendor' : 'customer', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Format stats
    const formattedStats = {
      total: 0,
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      totalRevenue: 0
    };

    stats.forEach(stat => {
      formattedStats.total += stat.count;
      formattedStats[stat._id] = stat.count;
      formattedStats.totalRevenue += stat.totalAmount || 0;
    });

    res.json({
      success: true,
      data: {
        stats: formattedStats,
        recentJobs
      }
    });

  } catch (error) {
    console.error('Error fetching job statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job statistics',
      error: error.message
    });
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJobStatus,
  addMessage,
  uploadFile,
  getJobStats
}; 