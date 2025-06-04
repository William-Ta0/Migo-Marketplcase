const ServiceCategory = require("../models/ServiceCategory");
const Service = require("../models/Service");

// Predefined service categories with comprehensive data
const defaultCategories = [
  {
    name: "Home Services",
    slug: "home-services",
    description:
      "Professional services for your home improvement, maintenance, and repair needs",
    icon: "🏠",
    color: "#10B981",
    displayOrder: 1,
    subcategories: [
      {
        name: "Plumbing",
        description: "Water systems, pipes, and fixtures",
        icon: "🔧",
      },
      {
        name: "Electrical",
        description: "Wiring, lighting, and electrical repairs",
        icon: "⚡",
      },
      {
        name: "HVAC",
        description: "Heating, ventilation, and air conditioning",
        icon: "❄️",
      },
      {
        name: "Painting",
        description: "Interior and exterior painting services",
        icon: "🎨",
      },
      {
        name: "Landscaping",
        description: "Garden design and lawn maintenance",
        icon: "🌱",
      },
      {
        name: "Roofing",
        description: "Roof repairs and installations",
        icon: "🏘️",
      },
      {
        name: "Flooring",
        description: "Installation and repair of all floor types",
        icon: "🏗️",
      },
      {
        name: "Appliance Repair",
        description: "Fix and maintain home appliances",
        icon: "🔨",
      },
    ],
  },
  {
    name: "Personal Services",
    slug: "personal-services",
    description: "Services to enhance your personal well-being and lifestyle",
    icon: "👤",
    color: "#8B5CF6",
    displayOrder: 2,
    subcategories: [
      {
        name: "Personal Training",
        description: "Fitness coaching and workout plans",
        icon: "💪",
      },
      {
        name: "Massage Therapy",
        description: "Therapeutic and relaxation massage",
        icon: "💆",
      },
      {
        name: "Hair & Beauty",
        description: "Hairstyling, makeup, and beauty treatments",
        icon: "💄",
      },
      {
        name: "Personal Chef",
        description: "Meal preparation and cooking services",
        icon: "👨‍🍳",
      },
      {
        name: "Pet Care",
        description: "Pet sitting, walking, and grooming",
        icon: "🐕",
      },
      {
        name: "House Cleaning",
        description: "Residential cleaning and organization",
        icon: "🧹",
      },
      {
        name: "Tutoring",
        description: "Educational support and academic coaching",
        icon: "📚",
      },
      {
        name: "Photography",
        description: "Event and portrait photography",
        icon: "📸",
      },
    ],
  },
  {
    name: "Business Services",
    slug: "business-services",
    description: "Professional services to help grow and manage your business",
    icon: "💼",
    color: "#3B82F6",
    displayOrder: 3,
    subcategories: [
      {
        name: "Digital Marketing",
        description: "SEO, social media, and online advertising",
        icon: "📈",
      },
      {
        name: "Web Development",
        description: "Website design and development",
        icon: "💻",
      },
      {
        name: "Graphic Design",
        description: "Logos, branding, and visual design",
        icon: "🎨",
      },
      {
        name: "Writing & Content",
        description: "Copywriting and content creation",
        icon: "✍️",
      },
      {
        name: "Bookkeeping",
        description: "Financial record keeping and accounting",
        icon: "📊",
      },
      {
        name: "Legal Services",
        description: "Legal consultation and document preparation",
        icon: "⚖️",
      },
      {
        name: "Business Consulting",
        description: "Strategy and operational guidance",
        icon: "🎯",
      },
      {
        name: "Translation",
        description: "Language translation services",
        icon: "🌐",
      },
    ],
  },
  {
    name: "Technology",
    slug: "technology",
    description:
      "IT support, software development, and tech consulting services",
    icon: "💻",
    color: "#6366F1",
    displayOrder: 4,
    subcategories: [
      {
        name: "IT Support",
        description: "Computer troubleshooting and maintenance",
        icon: "🔧",
      },
      {
        name: "Software Development",
        description: "Custom software and app development",
        icon: "⚙️",
      },
      {
        name: "Data Analysis",
        description: "Data processing and insights",
        icon: "📊",
      },
      {
        name: "Cybersecurity",
        description: "Security audits and protection",
        icon: "🔒",
      },
      {
        name: "Cloud Services",
        description: "Cloud migration and management",
        icon: "☁️",
      },
      {
        name: "Mobile App Development",
        description: "iOS and Android app creation",
        icon: "📱",
      },
      {
        name: "Database Management",
        description: "Database design and optimization",
        icon: "🗄️",
      },
      {
        name: "Tech Training",
        description: "Technology education and workshops",
        icon: "🎓",
      },
    ],
  },
  {
    name: "Automotive",
    slug: "automotive",
    description: "Vehicle maintenance, repair, and automotive services",
    icon: "🚗",
    color: "#DC2625",
    displayOrder: 5,
    subcategories: [
      {
        name: "Auto Repair",
        description: "General vehicle maintenance and repair",
        icon: "🔧",
      },
      {
        name: "Oil Change",
        description: "Regular oil change and fluid services",
        icon: "🛢️",
      },
      {
        name: "Tire Services",
        description: "Tire installation, repair, and rotation",
        icon: "🛞",
      },
      {
        name: "Car Detailing",
        description: "Interior and exterior car cleaning",
        icon: "✨",
      },
      {
        name: "Auto Glass",
        description: "Windshield and window repair/replacement",
        icon: "🔍",
      },
      {
        name: "Towing",
        description: "Emergency towing and roadside assistance",
        icon: "🚛",
      },
      {
        name: "Car Inspection",
        description: "Safety and emissions inspections",
        icon: "🔍",
      },
      {
        name: "Mobile Mechanic",
        description: "On-location automotive services",
        icon: "🚐",
      },
    ],
  },
  {
    name: "Health & Wellness",
    slug: "health-wellness",
    description: "Health, fitness, and wellness services for mind and body",
    icon: "🏥",
    color: "#059669",
    displayOrder: 6,
    subcategories: [
      {
        name: "Mental Health",
        description: "Counseling and therapy services",
        icon: "🧠",
      },
      {
        name: "Nutrition Coaching",
        description: "Diet planning and nutritional guidance",
        icon: "🥗",
      },
      {
        name: "Physical Therapy",
        description: "Rehabilitation and recovery services",
        icon: "🏃",
      },
      {
        name: "Yoga Instruction",
        description: "Yoga classes and mindfulness training",
        icon: "🧘",
      },
      {
        name: "Life Coaching",
        description: "Personal development and goal setting",
        icon: "🎯",
      },
      {
        name: "Alternative Medicine",
        description: "Holistic and alternative healing",
        icon: "🌿",
      },
      {
        name: "Senior Care",
        description: "Care services for elderly individuals",
        icon: "👴",
      },
      {
        name: "Childcare",
        description: "Babysitting and child supervision",
        icon: "👶",
      },
    ],
  },
];

// Get all categories with optional filtering
const getCategories = async (req, res) => {
  try {
    const { active, search, limit, page } = req.query;

    let query = {};
    if (active !== undefined) {
      query.isActive = active === "true";
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { "subcategories.name": { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    const categories = await ServiceCategory.find(query)
      .sort({ displayOrder: 1, name: 1 })
      .skip(skip)
      .limit(limitNum);

    const total = await ServiceCategory.countDocuments(query);

    res.json({
      success: true,
      data: categories,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};

// Get category by slug with subcategories
const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await ServiceCategory.findOne({ slug, isActive: true });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Get services count for this category
    const servicesCount = await Service.countDocuments({
      "category.slug": slug,
      isActive: true,
    });

    const categoryData = {
      ...category.toObject(),
      metadata: {
        ...category.metadata,
        totalServices: servicesCount,
      },
    };

    res.json({
      success: true,
      data: categoryData,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
};

// Get subcategories for a specific category
const getSubcategories = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await ServiceCategory.findOne({ slug, isActive: true });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const activeSubcategories = category.subcategories.filter(
      (sub) => sub.isActive
    );

    res.json({
      success: true,
      data: {
        category: {
          name: category.name,
          slug: category.slug,
          description: category.description,
        },
        subcategories: activeSubcategories,
      },
    });
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subcategories",
      error: error.message,
    });
  }
};

// Search categories and subcategories
const searchCategories = async (req, res) => {
  try {
    const { q, limit } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters long",
      });
    }

    const searchQuery = q.trim();
    const limitNum = parseInt(limit) || 20;

    const categories = await ServiceCategory.find({
      isActive: true,
      $or: [
        { name: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
        { "subcategories.name": { $regex: searchQuery, $options: "i" } },
      ],
    })
      .limit(limitNum)
      .select(
        "name slug description icon color subcategories.name subcategories.description"
      );

    // Format results for better UX
    const results = [];

    categories.forEach((category) => {
      // Add category match
      if (
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        results.push({
          type: "category",
          id: category._id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          icon: category.icon,
          color: category.color,
        });
      }

      // Add matching subcategories
      category.subcategories.forEach((subcategory) => {
        if (
          subcategory.name.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          results.push({
            type: "subcategory",
            id: subcategory._id,
            name: subcategory.name,
            description: subcategory.description,
            parentCategory: {
              name: category.name,
              slug: category.slug,
              icon: category.icon,
              color: category.color,
            },
          });
        }
      });
    });

    res.json({
      success: true,
      data: results.slice(0, limitNum),
      query: searchQuery,
    });
  } catch (error) {
    console.error("Error searching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search categories",
      error: error.message,
    });
  }
};

// Seed initial categories (admin only)
const seedCategories = async (req, res) => {
  try {
    // Check if categories already exist
    const existingCategories = await ServiceCategory.countDocuments();

    if (existingCategories > 0) {
      return res.status(400).json({
        success: false,
        message: "Categories already exist. Use update endpoints instead.",
      });
    }

    const categories = await ServiceCategory.insertMany(defaultCategories);

    res.json({
      success: true,
      message: `Successfully seeded ${categories.length} categories`,
      data: categories,
    });
  } catch (error) {
    console.error("Error seeding categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to seed categories",
      error: error.message,
    });
  }
};

// Get category statistics
const getCategoryStats = async (req, res) => {
  try {
    const stats = await ServiceCategory.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "services",
          let: { categorySlug: "$slug" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$category.slug", "$$categorySlug"] },
                isActive: true,
              },
            },
          ],
          as: "services",
        },
      },
      {
        $addFields: {
          serviceCount: { $size: "$services" },
          avgRating: {
            $avg: "$services.stats.rating.average",
          },
        },
      },
      {
        $project: {
          name: 1,
          slug: 1,
          icon: 1,
          color: 1,
          serviceCount: 1,
          avgRating: { $round: ["$avgRating", 1] },
          subcategoriesCount: { $size: "$subcategories" },
        },
      },
      { $sort: { serviceCount: -1 } },
    ]);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching category stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getCategories,
  getCategoryBySlug,
  getSubcategories,
  searchCategories,
  seedCategories,
  getCategoryStats,
};
