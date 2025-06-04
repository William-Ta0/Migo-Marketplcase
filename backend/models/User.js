const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    address: {
      street: {
        type: String,
        default: "",
      },
      city: {
        type: String,
        default: "",
      },
      state: {
        type: String,
        default: "",
      },
      zipCode: {
        type: String,
        default: "",
      },
      country: {
        type: String,
        default: "",
      },
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },
    authProvider: {
      type: String,
      enum: ["email", "google", "apple", "phone"],
      required: true,
    },
    role: {
      type: String,
      enum: ["customer", "vendor", "admin", null],
      default: null,
    },
    // Vendor-specific fields
    vendorInfo: {
      skills: [
        {
          category: {
            type: String,
            required: true,
          },
          subcategories: [
            {
              type: String,
              required: true,
            },
          ],
          experienceLevel: {
            type: String,
            enum: ["beginner", "intermediate", "expert"],
            default: "intermediate",
          },
        },
      ],
      verification: {
        status: {
          type: String,
          enum: ["pending", "submitted", "verified", "rejected"],
          default: "pending",
        },
        idDocument: {
          type: String,
          default: "",
        },
        businessLicense: {
          type: String,
          default: "",
        },
        submittedAt: {
          type: Date,
        },
        verifiedAt: {
          type: Date,
        },
      },
      onboardingCompleted: {
        type: Boolean,
        default: false,
      },
      rating: {
        average: {
          type: Number,
          default: 0,
        },
        count: {
          type: Number,
          default: 0,
        },
      },
      responseRate: {
        type: Number,
        default: 0,
      },
      completedJobs: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("User", userSchema);
