import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import DeleteAccount from "../components/DeleteAccount";
import "../styles/Profile.css";

const Profile = () => {
  const { currentUser, getUserProfile, updateUserProfile, uploadAvatar } =
    useAuth();
  const fileInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    bio: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
  });

  const [avatar, setAvatar] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userProfile = await getUserProfile();
        if (userProfile) {
          setFormData({
            name: userProfile.name || "",
            email: userProfile.email || "",
            phoneNumber: userProfile.phoneNumber || "",
            bio: userProfile.bio || "",
            address: {
              street: userProfile.address?.street || "",
              city: userProfile.address?.city || "",
              state: userProfile.address?.state || "",
              zipCode: userProfile.address?.zipCode || "",
              country: userProfile.address?.country || "",
            },
          });
          setAvatar(userProfile.avatar || "");
          setRole(userProfile.role || "No role assigned");
        } else {
          setFormData((prev) => ({
            ...prev,
            name: currentUser.displayName || "",
            email: currentUser.email || "",
          }));
          setRole("No role assigned");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchProfile();
    }
  }, [currentUser, getUserProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }

      setAvatarFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setMessage("");
      setUpdateLoading(true);

      let avatarUrl = avatar;

      // Upload avatar if new file selected
      if (avatarFile) {
        const uploadResult = await uploadAvatar(avatarFile);
        avatarUrl = uploadResult.avatar;
      }

      const updateData = {
        ...formData,
        avatar: avatarUrl,
      };

      await updateUserProfile(updateData);

      setAvatar(avatarUrl);
      setAvatarFile(null);
      setAvatarPreview("");
      setMessage("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update error:", error);
      setError("Failed to update profile: " + error.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  const displayRole = role
    ? role.charAt(0).toUpperCase() + role.slice(1)
    : "No role assigned";

  // Get the backend URL based on environment
  const getBackendUrl = () => {
    return process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_URL?.replace("/api", "") ||
          "https://your-backend-url.com"
      : "http://localhost:5555";
  };

  const getAvatarUrl = () => {
    if (avatarPreview) return avatarPreview;
    if (avatar) return `${getBackendUrl()}${avatar}`;
    return null;
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>My Profile</h2>
        <p>Manage your account information and preferences</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="profile-content">
        <form onSubmit={handleSubmit} className="profile-form">
          {/* Avatar Section */}
          <div className="profile-section">
            <h3>Profile Picture</h3>
            <div className="avatar-section">
              <div className="avatar-container">
                <div className="avatar-display">
                  {getAvatarUrl() ? (
                    <img
                      src={getAvatarUrl()}
                      alt="Profile"
                      className="avatar-image"
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      <span className="avatar-initials">
                        {formData.name
                          ? formData.name.charAt(0).toUpperCase()
                          : "U"}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Photo
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  style={{ display: "none" }}
                />
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="profile-section">
            <h3>Basic Information</h3>
            <div className="form-grid">
              <div className="form-control">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-control">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                />
                <small>Email cannot be changed</small>
              </div>
              <div className="form-control">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="form-control">
                <label>Role</label>
                <input type="text" value={displayRole} disabled />
                <small>Role can only be changed during registration</small>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="profile-section">
            <h3>Address</h3>
            <div className="form-grid">
              <div className="form-control full-width">
                <label>Street Address</label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  placeholder="123 Main Street"
                />
              </div>
              <div className="form-control">
                <label>City</label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  placeholder="New York"
                />
              </div>
              <div className="form-control">
                <label>State/Province</label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleInputChange}
                  placeholder="NY"
                />
              </div>
              <div className="form-control">
                <label>ZIP/Postal Code</label>
                <input
                  type="text"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleInputChange}
                  placeholder="10001"
                />
              </div>
              <div className="form-control">
                <label>Country</label>
                <input
                  type="text"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleInputChange}
                  placeholder="United States"
                />
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="profile-section">
            <h3>About Me</h3>
            <div className="form-control">
              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows="4"
                maxLength="500"
                placeholder="Tell us a little about yourself..."
              />
              <small>{formData.bio.length}/500 characters</small>
            </div>
          </div>

          {/* Submit Button */}
          <div className="profile-section">
            <button
              disabled={updateLoading}
              type="submit"
              className="btn btn-primary btn-large"
            >
              {updateLoading ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="danger-zone">
          <h3>Danger Zone</h3>
          <p>
            Once you delete your account, there is no going back. Please be
            certain.
          </p>
          <DeleteAccount />
        </div>
      </div>
    </div>
  );
};

export default Profile;
