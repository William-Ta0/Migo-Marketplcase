const User = require("../models/User");
const multer = require("multer");
const path = require("path");

// Configure multer for verification document uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath =
      file.fieldname === "idDocument"
        ? "uploads/verification/id/"
        : "uploads/verification/business/";
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const prefix = file.fieldname === "idDocument" ? "id" : "business";
    cb(
      null,
      `${prefix}-${req.user.uid}-${uniqueSuffix}${path.extname(
        file.originalname
      )}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  // Accept images and PDFs for verification documents
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(
      new Error("Only image files and PDFs are allowed for verification!"),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for documents
  },
});

// Service categories and subcategories
const SERVICE_CATEGORIES = {
  "Home Services": [
    "Cleaning",
    "Plumbing",
    "Electrical",
    "HVAC",
    "Landscaping",
    "Pest Control",
    "Home Security",
    "Appliance Repair",
    "Painting",
    "Roofing",
    "Carpentry",
  ],
  "Personal Services": [
    "Personal Training",
    "Massage Therapy",
    "Hair Styling",
    "Makeup",
    "Tutoring",
    "Pet Care",
    "Child Care",
    "Elder Care",
    "Personal Shopping",
  ],
  "Business Services": [
    "Accounting",
    "Legal",
    "Marketing",
    "Web Development",
    "Graphic Design",
    "Photography",
    "Videography",
    "Event Planning",
    "Catering",
    "Translation",
  ],
  Automotive: [
    "Auto Repair",
    "Car Detailing",
    "Towing",
    "Mobile Mechanic",
    "Car Rental",
  ],
  "Health & Wellness": [
    "Fitness Training",
    "Nutrition Counseling",
    "Mental Health",
    "Physical Therapy",
    "Chiropractic",
    "Acupuncture",
    "Yoga Instruction",
  ],
  Technology: [
    "Computer Repair",
    "Phone Repair",
    "Tech Support",
    "Software Development",
    "Data Recovery",
    "Network Setup",
    "Smart Home Installation",
  ],
};

// @desc    Get service categories
// @route   GET /api/vendor/categories
// @access  Public
const getServiceCategories = async (req, res) => {
  try {
    res.json({
      categories: SERVICE_CATEGORIES,
      message: "Service categories retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching service categories:", error);
    res.status(500).json({ error: "Error fetching service categories" });
  }
};

// @desc    Update vendor skills
// @route   PUT /api/vendor/skills
// @access  Private (Vendors only)
const updateVendorSkills = async (req, res) => {
  try {
    const { skills } = req.body;

    // Validate skills format
    if (!Array.isArray(skills)) {
      return res.status(400).json({ error: "Skills must be an array" });
    }

    // Validate each skill
    for (const skill of skills) {
      if (
        !skill.category ||
        !skill.subcategories ||
        !Array.isArray(skill.subcategories)
      ) {
        return res.status(400).json({ error: "Invalid skill format" });
      }

      if (!SERVICE_CATEGORIES[skill.category]) {
        return res
          .status(400)
          .json({ error: `Invalid category: ${skill.category}` });
      }

      for (const subcategory of skill.subcategories) {
        if (!SERVICE_CATEGORIES[skill.category].includes(subcategory)) {
          return res
            .status(400)
            .json({ error: `Invalid subcategory: ${subcategory}` });
        }
      }
    }

    // Find user first
    let user = await User.findOne({
      firebaseUid: req.user.uid,
      role: "vendor",
    });

    if (!user) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    // Initialize vendorInfo if it doesn't exist
    if (!user.vendorInfo) {
      user.vendorInfo = {
        skills: [],
        verification: {
          status: "pending",
          idDocument: "",
          businessLicense: "",
        },
        onboardingCompleted: false,
        rating: { average: 0, count: 0 },
        responseRate: 0,
        completedJobs: 0,
      };
    }

    // Update skills
    user.vendorInfo.skills = skills;
    user.updatedAt = new Date();

    // Save the user
    await user.save();

    res.json({
      message: "Skills updated successfully",
      skills: user.vendorInfo.skills,
    });
  } catch (error) {
    console.error("Error updating vendor skills:", error);
    res.status(500).json({ error: "Error updating vendor skills" });
  }
};

// @desc    Upload verification documents
// @route   POST /api/vendor/verification/upload
// @access  Private (Vendors only)
const uploadVerificationDocuments = async (req, res) => {
  try {
    const updateFields = {};

    if (req.files.idDocument && req.files.idDocument[0]) {
      updateFields[
        "vendorInfo.verification.idDocument"
      ] = `/uploads/verification/id/${req.files.idDocument[0].filename}`;
    }

    if (req.files.businessLicense && req.files.businessLicense[0]) {
      updateFields[
        "vendorInfo.verification.businessLicense"
      ] = `/uploads/verification/business/${req.files.businessLicense[0].filename}`;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: "No valid files uploaded" });
    }

    updateFields["vendorInfo.verification.status"] = "submitted";
    updateFields["vendorInfo.verification.submittedAt"] = new Date();

    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid, role: "vendor" },
      updateFields,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    res.json({
      message: "Verification documents uploaded successfully",
      verification: user.vendorInfo.verification,
    });
  } catch (error) {
    console.error("Error uploading verification documents:", error);
    res.status(500).json({ error: "Error uploading verification documents" });
  }
};

// @desc    Complete vendor onboarding
// @route   PUT /api/vendor/onboarding/complete
// @access  Private (Vendors only)
const completeOnboarding = async (req, res) => {
  try {
    let user = await User.findOne({
      firebaseUid: req.user.uid,
      role: "vendor",
    });

    if (!user) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    // Initialize vendorInfo if it doesn't exist
    if (!user.vendorInfo) {
      user.vendorInfo = {
        skills: [],
        verification: {
          status: "pending",
          idDocument: "",
          businessLicense: "",
        },
        onboardingCompleted: false,
        rating: { average: 0, count: 0 },
        responseRate: 0,
        completedJobs: 0,
      };
    }

    // Check if minimum requirements are met
    const hasSkills =
      user.vendorInfo.skills && user.vendorInfo.skills.length > 0;
    const hasVerificationSubmitted =
      user.vendorInfo.verification.status === "submitted";

    if (!hasSkills) {
      return res
        .status(400)
        .json({
          error: "Please add at least one skill before completing onboarding",
        });
    }

    // Update onboarding status
    user.vendorInfo.onboardingCompleted = true;
    await user.save();

    res.json({
      message: "Onboarding completed successfully",
      onboardingCompleted: true,
      nextSteps: hasVerificationSubmitted
        ? "Your verification documents are under review. You can start receiving service requests once verified."
        : "Consider submitting verification documents to increase trust with customers.",
    });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    res.status(500).json({ error: "Error completing onboarding" });
  }
};

// @desc    Get vendor profile
// @route   GET /api/vendor/profile
// @access  Private (Vendors only)
const getVendorProfile = async (req, res) => {
  try {
    let user = await User.findOne({
      firebaseUid: req.user.uid,
      role: "vendor",
    });

    if (!user) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    // Initialize vendorInfo if it doesn't exist
    if (!user.vendorInfo) {
      user.vendorInfo = {
        skills: [],
        verification: {
          status: "pending",
          idDocument: "",
          businessLicense: "",
        },
        onboardingCompleted: false,
        rating: { average: 0, count: 0 },
        responseRate: 0,
        completedJobs: 0,
      };
      await user.save();
    }

    res.json({
      profile: {
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        vendorInfo: user.vendorInfo,
      },
    });
  } catch (error) {
    console.error("Error fetching vendor profile:", error);
    res.status(500).json({ error: "Error fetching vendor profile" });
  }
};

module.exports = {
  getServiceCategories,
  updateVendorSkills,
  uploadVerificationDocuments,
  completeOnboarding,
  getVendorProfile,
  upload,
};
