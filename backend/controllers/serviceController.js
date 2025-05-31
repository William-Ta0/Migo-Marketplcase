const Service = require('../models/Service');
const ServiceCategory = require('../models/ServiceCategory');
const User = require('../models/User');

// Get all services with advanced filtering and search
const getServices = async (req, res) => {
  try {
    const {
      category,
      subcategory,
      location,
      priceMin,
      priceMax,
      rating,
      search,
      sort,
      page,
      limit,
      vendor,
      serviceType,
      promoted
    } = req.query;

    // Build query
    let query = { isActive: true };

    // Category filtering
    if (category) {
      query['category.slug'] = category;
    }

    // Subcategory filtering
    if (subcategory) {
      query['subcategory.name'] = subcategory;
    }

    // Location filtering
    if (location) {
      query.$or = [
        { 'location.serviceArea.cities': { $regex: location, $options: 'i' } },
        { 'location.serviceArea.states': { $regex: location, $options: 'i' } },
        { 'location.address.city': { $regex: location, $options: 'i' } },
        { 'location.address.state': { $regex: location, $options: 'i' } }
      ];
    }

    // Price filtering
    if (priceMin || priceMax) {
      query['pricing.amount'] = {};
      if (priceMin) query['pricing.amount'].$gte = parseFloat(priceMin);
      if (priceMax) query['pricing.amount'].$lte = parseFloat(priceMax);
    }

    // Rating filtering
    if (rating) {
      query['stats.rating.average'] = { $gte: parseFloat(rating) };
    }

    // Vendor filtering
    if (vendor) {
      query.vendor = vendor;
    }

    // Service type filtering
    if (serviceType) {
      query['pricing.type'] = serviceType;
    }

    // Promoted filtering
    if (promoted === 'true') {
      query.isPromoted = true;
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    let sortOption = {};
    switch (sort) {
      case 'price_low':
        sortOption = { 'pricing.amount': 1 };
        break;
      case 'price_high':
        sortOption = { 'pricing.amount': -1 };
        break;
      case 'rating':
        sortOption = { 'stats.rating.average': -1 };
        break;
      case 'popular':
        sortOption = { 'stats.views': -1, 'stats.bookings': -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      default:
        sortOption = { isPromoted: -1, 'stats.rating.average': -1, createdAt: -1 };
    }

    // Execute query
    const services = await Service.find(query)
      .populate('vendor', 'name email avatar phoneNumber address.city address.state')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count
    const total = await Service.countDocuments(query);

    // Format response
    const formattedServices = services.map(service => ({
      ...service,
      primaryImage: service.images?.find(img => img.isPrimary) || service.images?.[0] || null,
      displayRating: Math.round(service.stats.rating.average * 10) / 10,
      reviewCount: service.stats.rating.count
    }));

    res.json({
      success: true,
      data: formattedServices,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      },
      filters: {
        category,
        subcategory,
        location,
        priceRange: { min: priceMin, max: priceMax },
        rating,
        sort
      }
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: error.message
    });
  }
};

// Get service by ID
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id)
      .populate('vendor', 'name email avatar phoneNumber address bio role createdAt')
      .lean();

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Increment view count
    await Service.findByIdAndUpdate(id, { $inc: { 'stats.views': 1 } });

    // Get related services
    const relatedServices = await Service.find({
      'category.slug': service.category.slug,
      _id: { $ne: id },
      isActive: true
    })
    .populate('vendor', 'name avatar')
    .limit(4)
    .lean();

    // Format response
    const formattedService = {
      ...service,
      primaryImage: service.images?.find(img => img.isPrimary) || service.images?.[0] || null,
      displayRating: Math.round(service.stats.rating.average * 10) / 10,
      reviewCount: service.stats.rating.count,
      relatedServices: relatedServices.map(related => ({
        _id: related._id,
        title: related.title,
        shortDescription: related.shortDescription,
        pricing: related.pricing,
        vendor: related.vendor,
        primaryImage: related.images?.find(img => img.isPrimary) || related.images?.[0] || null,
        displayRating: Math.round(related.stats.rating.average * 10) / 10
      }))
    };

    res.json({
      success: true,
      data: formattedService
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service',
      error: error.message
    });
  }
};

// Search services with autocomplete
const searchServices = async (req, res) => {
  try {
    const { q, category, location, limit } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchQuery = q.trim();
    const limitNum = parseInt(limit) || 10;

    let query = {
      isActive: true,
      $text: { $search: searchQuery }
    };

    if (category) {
      query['category.slug'] = category;
    }

    if (location) {
      query.$and = [
        query.$and || [],
        {
          $or: [
            { 'location.serviceArea.cities': { $regex: location, $options: 'i' } },
            { 'location.serviceArea.states': { $regex: location, $options: 'i' } }
          ]
        }
      ];
    }

    const services = await Service.find(query, { score: { $meta: "textScore" } })
      .populate('vendor', 'name avatar')
      .sort({ score: { $meta: "textScore" } })
      .limit(limitNum)
      .select('title shortDescription pricing category subcategory images stats vendor')
      .lean();

    const suggestions = services.map(service => ({
      id: service._id,
      title: service.title,
      description: service.shortDescription,
      category: service.category.name,
      subcategory: service.subcategory.name,
      pricing: service.pricing,
      vendor: service.vendor,
      image: service.images?.find(img => img.isPrimary) || service.images?.[0] || null,
      rating: Math.round(service.stats.rating.average * 10) / 10
    }));

    res.json({
      success: true,
      data: suggestions,
      query: searchQuery
    });
  } catch (error) {
    console.error('Error searching services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search services',
      error: error.message
    });
  }
};

// Get services by category
const getServicesByCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const { subcategory, page, limit, sort } = req.query;

    let query = {
      'category.slug': slug,
      isActive: true
    };

    if (subcategory) {
      query['subcategory.name'] = subcategory;
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const skip = (pageNum - 1) * limitNum;

    let sortOption = { isPromoted: -1, 'stats.rating.average': -1 };
    if (sort === 'price_low') sortOption = { 'pricing.amount': 1 };
    if (sort === 'price_high') sortOption = { 'pricing.amount': -1 };
    if (sort === 'rating') sortOption = { 'stats.rating.average': -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };

    const services = await Service.find(query)
      .populate('vendor', 'name avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Service.countDocuments(query);

    // Get category info
    const category = await ServiceCategory.findOne({ slug, isActive: true });

    res.json({
      success: true,
      data: {
        category: category ? {
          name: category.name,
          slug: category.slug,
          description: category.description,
          icon: category.icon,
          color: category.color
        } : null,
        services: services.map(service => ({
          ...service,
          primaryImage: service.images?.find(img => img.isPrimary) || service.images?.[0] || null,
          displayRating: Math.round(service.stats.rating.average * 10) / 10
        }))
      },
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching services by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services by category',
      error: error.message
    });
  }
};

// Get featured/promoted services
const getFeaturedServices = async (req, res) => {
  try {
    const { limit, category } = req.query;
    const limitNum = parseInt(limit) || 8;

    let query = { isActive: true };
    
    // Either promoted services or highest rated services
    const promotedServices = await Service.find({
      ...query,
      isPromoted: true,
      ...(category && { 'category.slug': category })
    })
    .populate('vendor', 'name avatar')
    .sort({ 'stats.rating.average': -1, createdAt: -1 })
    .limit(limitNum)
    .lean();

    // If not enough promoted services, fill with highest rated
    let services = promotedServices;
    if (services.length < limitNum) {
      const additional = await Service.find({
        ...query,
        isPromoted: false,
        _id: { $nin: services.map(s => s._id) },
        ...(category && { 'category.slug': category })
      })
      .populate('vendor', 'name avatar')
      .sort({ 'stats.rating.average': -1, 'stats.bookings': -1 })
      .limit(limitNum - services.length)
      .lean();

      services = [...services, ...additional];
    }

    const formattedServices = services.map(service => ({
      ...service,
      primaryImage: service.images?.find(img => img.isPrimary) || service.images?.[0] || null,
      displayRating: Math.round(service.stats.rating.average * 10) / 10,
      isFeatured: service.isPromoted
    }));

    res.json({
      success: true,
      data: formattedServices
    });
  } catch (error) {
    console.error('Error fetching featured services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured services',
      error: error.message
    });
  }
};

// Get service statistics for admin/analytics
const getServiceStats = async (req, res) => {
  try {
    const stats = await Service.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category.slug',
          categoryName: { $first: '$category.name' },
          totalServices: { $sum: 1 },
          avgRating: { $avg: '$stats.rating.average' },
          totalViews: { $sum: '$stats.views' },
          totalBookings: { $sum: '$stats.bookings' },
          avgPrice: { $avg: '$pricing.amount' }
        }
      },
      {
        $project: {
          categorySlug: '$_id',
          categoryName: 1,
          totalServices: 1,
          avgRating: { $round: ['$avgRating', 1] },
          totalViews: 1,
          totalBookings: 1,
          avgPrice: { $round: ['$avgPrice', 2] }
        }
      },
      { $sort: { totalServices: -1 } }
    ]);

    const overview = await Service.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalServices: { $sum: 1 },
          avgRating: { $avg: '$stats.rating.average' },
          totalViews: { $sum: '$stats.views' },
          totalBookings: { $sum: '$stats.bookings' },
          promotedServices: { $sum: { $cond: ['$isPromoted', 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: overview[0] || {},
        categories: stats
      }
    });
  } catch (error) {
    console.error('Error fetching service statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service statistics',
      error: error.message
    });
  }
};

module.exports = {
  getServices,
  getServiceById,
  searchServices,
  getServicesByCategory,
  getFeaturedServices,
  getServiceStats
}; 