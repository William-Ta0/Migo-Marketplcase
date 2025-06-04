import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/VendorOnboarding.css";

const VendorOnboarding = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const idDocumentRef = useRef(null);
  const businessLicenseRef = useRef(null);

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Categories and skills state
  const [categories, setCategories] = useState({});
  const [selectedSkills, setSelectedSkills] = useState([]);

  // Verification documents state
  const [idDocument, setIdDocument] = useState(null);
  const [businessLicense, setBusinessLicense] = useState(null);
  const [idPreview, setIdPreview] = useState("");
  const [businessPreview, setBusinessPreview] = useState("");

  // Onboarding completion state
  const [onboardingData, setOnboardingData] = useState({
    skillsCompleted: false,
    documentsUploaded: false,
    onboardingCompleted: false,
  });

  const totalSteps = 4;

  const fetchServiceCategories = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/vendor/categories`);
      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Failed to load service categories");
    }
  };

  const checkOnboardingStatus = async () => {
    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${getApiUrl()}/vendor/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const vendorInfo = data.profile.vendorInfo;

        if (vendorInfo.onboardingCompleted) {
          navigate("/dashboard");
          return;
        }

        // Set current step based on completion status
        if (vendorInfo.skills && vendorInfo.skills.length > 0) {
          setSelectedSkills(vendorInfo.skills);
          setOnboardingData((prev) => ({ ...prev, skillsCompleted: true }));
          setCurrentStep(3); // Go to verification step if skills are already saved
        }

        if (vendorInfo.verification.status === "submitted") {
          setOnboardingData((prev) => ({ ...prev, documentsUploaded: true }));
          setCurrentStep(4); // Go to review step if documents are uploaded
        }
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    }
  };

  useEffect(() => {
    fetchServiceCategories();
    checkOnboardingStatus();
  }, [currentUser]); // Add currentUser as dependency

  const getApiUrl = () => {
    return process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL || "https://your-backend-url.com/api"
      : "http://localhost:5001/api";
  };

  const addSkill = (category) => {
    const newSkill = {
      category,
      subcategories: [],
      experienceLevel: "intermediate",
    };
    setSelectedSkills((prev) => [...prev, newSkill]);
  };

  const removeSkill = (index) => {
    setSelectedSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSkillSubcategories = (index, subcategories) => {
    setSelectedSkills((prev) =>
      prev.map((skill, i) =>
        i === index ? { ...skill, subcategories } : skill
      )
    );
  };

  const updateSkillExperience = (index, experienceLevel) => {
    setSelectedSkills((prev) =>
      prev.map((skill, i) =>
        i === index ? { ...skill, experienceLevel } : skill
      )
    );
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Please upload an image (JPG, PNG) or PDF file");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    if (type === "id") {
      setIdDocument(file);
      // Create preview if it's an image
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setIdPreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setIdPreview("");
      }
    } else {
      setBusinessLicense(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setBusinessPreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setBusinessPreview("");
      }
    }
  };

  const saveSkills = async () => {
    try {
      setLoading(true);
      setError("");

      if (selectedSkills.length === 0) {
        setError("Please select at least one skill");
        return;
      }

      // Validate that each skill has subcategories
      for (const skill of selectedSkills) {
        if (skill.subcategories.length === 0) {
          setError(`Please select subcategories for ${skill.category}`);
          return;
        }
      }

      if (!currentUser) {
        setError("Authentication error. Please log in again.");
        return;
      }

      const token = await currentUser.getIdToken();
      const response = await fetch(`${getApiUrl()}/vendor/skills`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skills: selectedSkills }),
      });

      if (response.ok) {
        setOnboardingData((prev) => ({ ...prev, skillsCompleted: true }));
        setMessage("Skills saved successfully!");
        setTimeout(() => {
          setCurrentStep(3); // Go to verification step (step 3)
          setMessage("");
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to save skills");
      }
    } catch (error) {
      console.error("Error saving skills:", error);
      setError("Failed to save skills. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const uploadDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      if (!idDocument) {
        setError("Please upload your ID document");
        return;
      }

      if (!currentUser) {
        setError("Authentication error. Please log in again.");
        return;
      }

      const formData = new FormData();
      formData.append("idDocument", idDocument);
      if (businessLicense) {
        formData.append("businessLicense", businessLicense);
      }

      const token = await currentUser.getIdToken();
      const response = await fetch(
        `${getApiUrl()}/vendor/verification/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        setOnboardingData((prev) => ({ ...prev, documentsUploaded: true }));
        setMessage("Documents uploaded successfully!");
        setTimeout(() => {
          setCurrentStep(4); // Go to review step (step 4)
          setMessage("");
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to upload documents");
      }
    } catch (error) {
      console.error("Error uploading documents:", error);
      setError("Failed to upload documents. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      setLoading(true);
      setError("");

      if (!currentUser) {
        setError("Authentication error. Please log in again.");
        return;
      }

      const token = await currentUser.getIdToken();
      const response = await fetch(
        `${getApiUrl()}/vendor/onboarding/complete`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOnboardingData((prev) => ({ ...prev, onboardingCompleted: true }));
        setMessage(data.message);
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to complete onboarding");
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setError("Failed to complete onboarding. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderSkillsStep = () => (
    <div className="onboarding-step">
      <div className="step-header">
        <h3>Select Your Skills</h3>
        <p>Choose the services you can provide to start receiving requests</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="categories-grid">
        {Object.entries(categories).map(([category, subcategories]) => (
          <div key={category} className="category-card">
            <h4>{category}</h4>
            <div className="subcategories">
              {subcategories.map((subcategory) => (
                <span key={subcategory} className="subcategory-tag">
                  {subcategory}
                </span>
              ))}
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => addSkill(category)}
              disabled={selectedSkills.some(
                (skill) => skill.category === category
              )}
            >
              {selectedSkills.some((skill) => skill.category === category)
                ? "Added"
                : "Add Skill"}
            </button>
          </div>
        ))}
      </div>

      {selectedSkills.length > 0 && (
        <div className="selected-skills">
          <h4>Your Selected Skills</h4>
          {selectedSkills.map((skill, index) => (
            <div key={index} className="skill-config">
              <div className="skill-header">
                <h5>{skill.category}</h5>
                <button
                  className="btn btn-danger btn-small"
                  onClick={() => removeSkill(index)}
                >
                  Remove
                </button>
              </div>

              <div className="skill-details">
                <div className="subcategory-selection">
                  <label>Select specific services:</label>
                  <div className="checkbox-grid">
                    {categories[skill.category]?.map((subcategory) => (
                      <label key={subcategory} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={skill.subcategories.includes(subcategory)}
                          onChange={(e) => {
                            const newSubcategories = e.target.checked
                              ? [...skill.subcategories, subcategory]
                              : skill.subcategories.filter(
                                  (s) => s !== subcategory
                                );
                            updateSkillSubcategories(index, newSubcategories);
                          }}
                        />
                        {subcategory}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="experience-selection">
                  <label>Experience Level:</label>
                  <select
                    value={skill.experienceLevel}
                    onChange={(e) =>
                      updateSkillExperience(index, e.target.value)
                    }
                  >
                    <option value="beginner">Beginner (0-2 years)</option>
                    <option value="intermediate">
                      Intermediate (2-5 years)
                    </option>
                    <option value="expert">Expert (5+ years)</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="step-actions">
        <button
          className="btn btn-primary"
          onClick={saveSkills}
          disabled={loading || selectedSkills.length === 0}
        >
          {loading ? "Saving..." : "Save Skills & Continue"}
        </button>
      </div>
    </div>
  );

  const renderVerificationStep = () => (
    <div className="onboarding-step">
      <div className="step-header">
        <h3>Verification Documents</h3>
        <p>Upload your identification to build trust with customers</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="document-upload-section">
        <div className="document-upload">
          <h4>ID Document (Required)</h4>
          <p>
            Upload a government-issued ID (driver's license, passport, etc.)
          </p>

          <div
            className="upload-area"
            onClick={() => idDocumentRef.current?.click()}
          >
            {idPreview ? (
              <img
                src={idPreview}
                alt="ID Preview"
                className="document-preview"
              />
            ) : (
              <div className="upload-placeholder">
                <span className="upload-icon">📄</span>
                <p>Click to upload ID document</p>
                <small>JPG, PNG, or PDF (max 10MB)</small>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={idDocumentRef}
            onChange={(e) => handleFileChange(e, "id")}
            accept="image/*,.pdf"
            style={{ display: "none" }}
          />

          {idDocument && (
            <p className="file-info">
              Selected: {idDocument.name} (
              {(idDocument.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div className="document-upload">
          <h4>Business License (Optional)</h4>
          <p>Upload your business license if you have one</p>

          <div
            className="upload-area"
            onClick={() => businessLicenseRef.current?.click()}
          >
            {businessPreview ? (
              <img
                src={businessPreview}
                alt="Business License Preview"
                className="document-preview"
              />
            ) : (
              <div className="upload-placeholder">
                <span className="upload-icon">🏢</span>
                <p>Click to upload business license</p>
                <small>JPG, PNG, or PDF (max 10MB)</small>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={businessLicenseRef}
            onChange={(e) => handleFileChange(e, "business")}
            accept="image/*,.pdf"
            style={{ display: "none" }}
          />

          {businessLicense && (
            <p className="file-info">
              Selected: {businessLicense.name} (
              {(businessLicense.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>
      </div>

      <div className="verification-info">
        <div className="info-card">
          <h4>🔒 Your documents are secure</h4>
          <ul>
            <li>Documents are encrypted and stored securely</li>
            <li>Only used for identity verification</li>
            <li>Reviewed within 24-48 hours</li>
            <li>You'll be notified of verification status</li>
          </ul>
        </div>
      </div>

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={prevStep}>
          Back
        </button>
        <button
          className="btn btn-primary"
          onClick={uploadDocuments}
          disabled={loading || !idDocument}
        >
          {loading ? "Uploading..." : "Upload Documents & Continue"}
        </button>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="onboarding-step">
      <div className="step-header">
        <h3>Review & Complete</h3>
        <p>Review your information and complete your vendor onboarding</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="review-section">
        <div className="review-card">
          <h4>✅ Skills Configured</h4>
          <p>{selectedSkills.length} skill categories selected</p>
          <div className="skill-summary">
            {selectedSkills.map((skill, index) => (
              <div key={index} className="skill-item">
                <strong>{skill.category}</strong>
                <span className="experience-badge">
                  {skill.experienceLevel}
                </span>
                <p>{skill.subcategories.join(", ")}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="review-card">
          <h4>📋 Verification Status</h4>
          {onboardingData.documentsUploaded ? (
            <div className="status-item success">
              <span>✅ Documents uploaded and under review</span>
              <p>You'll be notified once verification is complete</p>
            </div>
          ) : (
            <div className="status-item pending">
              <span>⏳ No documents uploaded</span>
              <p>You can add verification documents later in your profile</p>
            </div>
          )}
        </div>

        <div className="next-steps-card">
          <h4>🚀 What's Next?</h4>
          <ul>
            <li>Complete onboarding to activate your vendor profile</li>
            <li>Start receiving service requests from customers</li>
            <li>Build your reputation with reviews and ratings</li>
            <li>Upload verification documents to increase trust</li>
          </ul>
        </div>
      </div>

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={prevStep}>
          Back
        </button>
        <button
          className="btn btn-primary btn-large"
          onClick={completeOnboarding}
          disabled={loading}
        >
          {loading ? "Completing..." : "Complete Onboarding"}
        </button>
      </div>
    </div>
  );

  const renderWelcomeStep = () => (
    <div className="onboarding-step welcome-step">
      <div className="welcome-content">
        <h2>Welcome to Migo Marketplace!</h2>
        <p>
          Let's get you set up as a vendor so you can start receiving service
          requests
        </p>

        <div className="onboarding-overview">
          <h3>What we'll cover:</h3>
          <div className="overview-steps">
            <div className="overview-step">
              <span className="step-number">1</span>
              <div>
                <h4>Select Your Skills</h4>
                <p>Choose the services you can provide</p>
              </div>
            </div>
            <div className="overview-step">
              <span className="step-number">2</span>
              <div>
                <h4>Verification Documents</h4>
                <p>Upload ID for customer trust (optional)</p>
              </div>
            </div>
            <div className="overview-step">
              <span className="step-number">3</span>
              <div>
                <h4>Review & Complete</h4>
                <p>Finalize your vendor profile</p>
              </div>
            </div>
          </div>
        </div>

        <div className="welcome-benefits">
          <h3>Benefits of being a verified vendor:</h3>
          <ul>
            <li>🎯 Receive targeted service requests</li>
            <li>💰 Set your own prices and availability</li>
            <li>⭐ Build reputation through customer reviews</li>
            <li>🔒 Secure payment processing</li>
            <li>📱 Manage everything from your mobile device</li>
          </ul>
        </div>
      </div>

      <div className="step-actions">
        <button className="btn btn-primary btn-large" onClick={nextStep}>
          Get Started
        </button>
      </div>
    </div>
  );

  return (
    <div className="vendor-onboarding">
      <div className="onboarding-header">
        <h1>Vendor Onboarding</h1>
        <div className="progress-bar">
          <div className="progress-steps">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`progress-step ${
                  step <= currentStep ? "active" : ""
                } ${step < currentStep ? "completed" : ""}`}
              >
                <span className="step-number">{step}</span>
                <span className="step-label">
                  {step === 1 && "Welcome"}
                  {step === 2 && "Skills"}
                  {step === 3 && "Verification"}
                  {step === 4 && "Complete"}
                </span>
              </div>
            ))}
          </div>
          <div
            className="progress-fill"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="onboarding-content">
        {currentStep === 1 && renderWelcomeStep()}
        {currentStep === 2 && renderSkillsStep()}
        {currentStep === 3 && renderVerificationStep()}
        {currentStep === 4 && renderReviewStep()}
      </div>
    </div>
  );
};

export default VendorOnboarding;
