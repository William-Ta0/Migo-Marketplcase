const mongoose = require("mongoose");
const dotenv = require("dotenv");
const ServiceCategory = require("../models/ServiceCategory");
const Service = require("../models/Service");
const User = require("../models/User");

// Load environment variables
dotenv.config();

// Sample categories data
const categoriesData = [
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
];

// Sample users data (vendors)
const sampleUsers = [
  {
    firebaseUid: "sample-vendor-1",
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    phoneNumber: "+1-555-0101",
    address: {
      street: "123 Main St",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "USA",
    },
    bio: "Professional plumber with 15+ years of experience",
    authProvider: "email",
    role: "vendor",
  },
  {
    firebaseUid: "sample-vendor-2",
    name: "Sarah Williams",
    email: "sarah.williams@example.com",
    phoneNumber: "+1-555-0102",
    address: {
      street: "456 Oak Ave",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90210",
      country: "USA",
    },
    bio: "Certified personal trainer and nutrition coach",
    authProvider: "email",
    role: "vendor",
  },
  {
    firebaseUid: "sample-vendor-3",
    name: "David Chen",
    email: "david.chen@example.com",
    phoneNumber: "+1-555-0103",
    address: {
      street: "789 Pine St",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
      country: "USA",
    },
    bio: "Full-stack developer specializing in React and Node.js",
    authProvider: "email",
    role: "vendor",
  },
  {
    firebaseUid: "sample-vendor-4",
    name: "Lisa Rodriguez",
    email: "lisa.rodriguez@example.com",
    phoneNumber: "+1-555-0104",
    address: {
      street: "321 Elm St",
      city: "Austin",
      state: "TX",
      zipCode: "73301",
      country: "USA",
    },
    bio: "Licensed electrician with commercial and residential experience",
    authProvider: "email",
    role: "vendor",
  },
  {
    firebaseUid: "sample-vendor-5",
    name: "James Park",
    email: "james.park@example.com",
    phoneNumber: "+1-555-0105",
    address: {
      street: "654 Maple Dr",
      city: "Portland",
      state: "OR",
      zipCode: "97201",
      country: "USA",
    },
    bio: "Digital marketing specialist helping businesses grow online",
    authProvider: "email",
    role: "vendor",
  },
];

// Function to create sample services
const createSampleServices = async (categories, users) => {
  const services = [];

  // Home Services - Plumbing
  const homeCategory = categories.find((c) => c.slug === "home-services");
  const mikeUser = users.find((u) => u.name === "Mike Johnson");

  services.push({
    title: "Emergency Plumbing Repair",
    description:
      "Fast and reliable emergency plumbing services available 24/7. I handle all types of plumbing emergencies including burst pipes, clogged drains, water heater issues, and toilet repairs. Licensed and insured with over 15 years of experience.",
    shortDescription:
      "24/7 emergency plumbing repairs for all your urgent needs",
    vendor: mikeUser._id,
    category: {
      id: homeCategory._id,
      name: homeCategory.name,
      slug: homeCategory.slug,
    },
    subcategory: {
      name: "Plumbing",
      description: "Water systems, pipes, and fixtures",
    },
    pricing: {
      type: "hourly",
      amount: 85,
      currency: "USD",
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500",
        alt: "Plumber fixing pipes",
        isPrimary: true,
      },
    ],
    location: {
      type: "onsite",
      serviceArea: {
        radius: 30,
        cities: ["San Francisco", "Oakland", "San Jose"],
        states: ["CA"],
        countries: ["USA"],
      },
      address: mikeUser.address,
    },
    features: [
      "24/7 Emergency Service",
      "Licensed & Insured",
      "Free Estimates",
      "Satisfaction Guaranteed",
    ],
    tags: ["emergency", "plumbing", "repair", "24/7"],
    requirements: ["Access to affected area", "Clear description of issue"],
    deliverables: ["Professional repair", "Cleanup", "Warranty documentation"],
    estimatedDuration: { min: 1, max: 4, unit: "hours" },
    isActive: true,
    isPromoted: true,
    stats: {
      views: 245,
      inquiries: 32,
      bookings: 18,
      rating: { average: 4.8, count: 24 },
    },
  });

  // Personal Services - Personal Training
  const personalCategory = categories.find(
    (c) => c.slug === "personal-services"
  );
  const sarahUser = users.find((u) => u.name === "Sarah Williams");

  services.push({
    title: "Personal Fitness Training & Nutrition Coaching",
    description:
      "Transform your body and mind with personalized fitness training and nutrition coaching. I create custom workout plans tailored to your goals, whether it's weight loss, muscle building, or overall health improvement. Includes meal planning and ongoing support.",
    shortDescription:
      "Personalized fitness training with custom workout and nutrition plans",
    vendor: sarahUser._id,
    category: {
      id: personalCategory._id,
      name: personalCategory.name,
      slug: personalCategory.slug,
    },
    subcategory: {
      name: "Personal Training",
      description: "Fitness coaching and workout plans",
    },
    pricing: {
      type: "package",
      packages: [
        {
          name: "Starter Package",
          description: "4 sessions + basic nutrition plan",
          price: 280,
          features: [
            "4 one-on-one sessions",
            "Basic nutrition plan",
            "Exercise demonstrations",
          ],
          deliveryTime: 30,
        },
        {
          name: "Complete Transformation",
          description: "12 sessions + comprehensive plan",
          price: 750,
          features: [
            "12 one-on-one sessions",
            "Comprehensive nutrition plan",
            "Progress tracking",
            "24/7 support",
          ],
          deliveryTime: 90,
        },
      ],
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500",
        alt: "Personal trainer working with client",
        isPrimary: true,
      },
    ],
    location: {
      type: "both",
      serviceArea: {
        radius: 25,
        cities: ["Los Angeles", "Beverly Hills", "Santa Monica"],
        states: ["CA"],
        countries: ["USA"],
      },
    },
    features: [
      "Certified Trainer",
      "Custom Meal Plans",
      "Progress Tracking",
      "Flexible Scheduling",
    ],
    tags: ["fitness", "training", "nutrition", "weight-loss"],
    requirements: ["Health clearance", "Fitness goals discussion"],
    deliverables: [
      "Custom workout plan",
      "Nutrition guide",
      "Progress reports",
    ],
    estimatedDuration: { min: 4, max: 12, unit: "weeks" },
    isActive: true,
    isPromoted: false,
    stats: {
      views: 189,
      inquiries: 28,
      bookings: 15,
      rating: { average: 4.9, count: 19 },
    },
  });

  // Technology - Web Development
  const techCategory = categories.find((c) => c.slug === "technology");
  const davidUser = users.find((u) => u.name === "David Chen");

  services.push({
    title: "Custom Web Application Development",
    description:
      "Professional web application development using modern technologies like React, Node.js, and MongoDB. I specialize in creating responsive, user-friendly applications that meet your business needs. From concept to deployment, I handle the entire development process.",
    shortDescription:
      "Full-stack web development with React, Node.js, and modern technologies",
    vendor: davidUser._id,
    category: {
      id: techCategory._id,
      name: techCategory.name,
      slug: techCategory.slug,
    },
    subcategory: {
      name: "Web Development",
      description: "Website design and development",
    },
    pricing: {
      type: "fixed",
      amount: 2500,
      currency: "USD",
      customNote: "Price varies based on complexity and features",
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500",
        alt: "Web developer coding",
        isPrimary: true,
      },
    ],
    location: {
      type: "remote",
      serviceArea: {
        countries: ["USA", "Canada"],
      },
    },
    features: [
      "Responsive Design",
      "Modern Tech Stack",
      "SEO Optimized",
      "Mobile-First",
      "Security Best Practices",
    ],
    tags: ["web development", "react", "nodejs", "full-stack"],
    requirements: [
      "Project requirements document",
      "Design preferences",
      "Timeline expectations",
    ],
    deliverables: [
      "Source code",
      "Documentation",
      "Deployment",
      "Training session",
    ],
    estimatedDuration: { min: 4, max: 8, unit: "weeks" },
    isActive: true,
    isPromoted: true,
    stats: {
      views: 312,
      inquiries: 45,
      bookings: 8,
      rating: { average: 4.7, count: 12 },
    },
  });

  // More services for variety
  const lisaUser = users.find((u) => u.name === "Lisa Rodriguez");

  services.push({
    title: "Residential Electrical Installation & Repair",
    description:
      "Licensed electrician providing safe and reliable electrical services for your home. Services include outlet installation, lighting upgrades, electrical panel upgrades, and troubleshooting electrical issues. All work meets local codes and safety standards.",
    shortDescription: "Licensed electrical services for residential properties",
    vendor: lisaUser._id,
    category: {
      id: homeCategory._id,
      name: homeCategory.name,
      slug: homeCategory.slug,
    },
    subcategory: {
      name: "Electrical",
      description: "Wiring, lighting, and electrical repairs",
    },
    pricing: {
      type: "hourly",
      amount: 95,
      currency: "USD",
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500",
        alt: "Electrician working on electrical panel",
        isPrimary: true,
      },
    ],
    location: {
      type: "onsite",
      serviceArea: {
        radius: 40,
        cities: ["Austin", "Round Rock", "Cedar Park"],
        states: ["TX"],
        countries: ["USA"],
      },
      address: lisaUser.address,
    },
    features: [
      "Licensed & Bonded",
      "Code Compliant",
      "Safety Guaranteed",
      "Emergency Service",
    ],
    tags: ["electrical", "installation", "repair", "licensed"],
    requirements: [
      "Access to electrical panel",
      "Clear description of electrical issue",
    ],
    deliverables: [
      "Professional electrical work",
      "Code compliance certificate",
      "Warranty",
    ],
    estimatedDuration: { min: 2, max: 6, unit: "hours" },
    isActive: true,
    isPromoted: false,
    stats: {
      views: 167,
      inquiries: 23,
      bookings: 12,
      rating: { average: 4.6, count: 15 },
    },
  });

  const businessCategory = categories.find(
    (c) => c.slug === "business-services"
  );
  const jamesUser = users.find((u) => u.name === "James Park");

  services.push({
    title: "Digital Marketing Strategy & Implementation",
    description:
      "Comprehensive digital marketing services to grow your business online. I help businesses increase their online presence through SEO, social media marketing, content creation, and paid advertising campaigns. Data-driven approach with measurable results.",
    shortDescription:
      "Complete digital marketing solutions to grow your business online",
    vendor: jamesUser._id,
    category: {
      id: businessCategory._id,
      name: businessCategory.name,
      slug: businessCategory.slug,
    },
    subcategory: {
      name: "Digital Marketing",
      description: "SEO, social media, and online advertising",
    },
    pricing: {
      type: "package",
      packages: [
        {
          name: "Starter Marketing",
          description: "Basic SEO and social media setup",
          price: 500,
          features: ["SEO audit", "Social media setup", "Content calendar"],
          deliveryTime: 14,
        },
        {
          name: "Growth Package",
          description: "Comprehensive marketing strategy",
          price: 1200,
          features: [
            "Full marketing strategy",
            "Campaign management",
            "Monthly reports",
            "Ongoing optimization",
          ],
          deliveryTime: 30,
        },
      ],
    },
    location: {
      type: "remote",
      serviceArea: {
        countries: ["USA"],
      },
    },
    features: [
      "Data-Driven Results",
      "Custom Strategy",
      "ROI Tracking",
      "Ongoing Support",
    ],
    tags: ["digital marketing", "seo", "social media", "advertising"],
    isActive: true,
    isPromoted: true,
    stats: {
      views: 298,
      inquiries: 38,
      bookings: 11,
      rating: { average: 4.8, count: 16 },
    },
  });

  return services;
};

// Main seeding function
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await ServiceCategory.deleteMany({});
    await Service.deleteMany({});
    await User.deleteMany({
      role: "vendor",
      firebaseUid: { $regex: /^sample-vendor/ },
    });
    console.log("Cleared existing sample data");

    // Seed categories
    const categories = await ServiceCategory.insertMany(categoriesData);
    console.log(`Seeded ${categories.length} categories`);

    // Seed sample users
    const users = await User.insertMany(sampleUsers);
    console.log(`Seeded ${users.length} sample vendor users`);

    // Seed services
    const services = await createSampleServices(categories, users);
    const createdServices = await Service.insertMany(services);
    console.log(`Seeded ${createdServices.length} sample services`);

    // Update category metadata with service counts
    for (const category of categories) {
      const serviceCount = await Service.countDocuments({
        "category.slug": category.slug,
        isActive: true,
      });

      await ServiceCategory.findByIdAndUpdate(category._id, {
        "metadata.totalServices": serviceCount,
      });
    }
    console.log("Updated category metadata");

    console.log("\n✅ Database seeding completed successfully!");
    console.log("\nSample data created:");
    console.log(`- ${categories.length} service categories`);
    console.log(`- ${users.length} vendor users`);
    console.log(`- ${createdServices.length} services`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
