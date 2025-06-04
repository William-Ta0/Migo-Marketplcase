import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createService } from '../api/serviceApi';
import { useAuth } from '../context/AuthContext';
import '../styles/CreateService.css';

const CreateService = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    pricing: {
      type: 'fixed',
      currency: 'USD',
      amount: '',
      packages: []
    },
    location: {
      type: 'remote',
      address: ''
    },
    deliveryTime: '',
    requirements: [''],
    deliverables: [''],
    tags: ''
  });
  const [error, setError] = useState(null);

  // Check authentication on component mount
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
  }, [user, authLoading, navigate]);

  const categories = [
    'Web Development',
    'Mobile Development', 
    'Design & Creative',
    'Digital Marketing',
    'Writing & Translation',
    'Video & Animation',
    'Programming & Tech',
    'Business',
    'Music & Audio',
    'Data',
    'Photography'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Service title is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Service description is required');
      return false;
    }
    if (!formData.category) {
      setError('Category is required');
      return false;
    }
    if (!formData.deliveryTime || formData.deliveryTime < 1) {
      setError('Delivery time must be at least 1 day');
      return false;
    }
    if (!formData.pricing.amount || parseFloat(formData.pricing.amount) <= 0) {
      setError('Price must be greater than 0');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate authentication
    if (!user) {
      setError('You must be logged in to create a service');
      navigate('/login');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Prepare service data with better validation
      const serviceData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        subcategory: formData.subcategory || formData.category,
        shortDescription: formData.description.trim().substring(0, 150),
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        requirements: formData.requirements.filter(req => req && req.trim()),
        deliverables: formData.deliverables.filter(del => del && del.trim()),
        deliveryTime: parseInt(formData.deliveryTime),
        pricing: {
          type: formData.pricing.type,
          currency: formData.pricing.currency,
          amount: parseFloat(formData.pricing.amount)
        },
        location: {
          type: formData.location.type,
          address: formData.location.address || ''
        },
        isActive: true,
        featured: false,
        images: [], // Will be handled later if needed
        stats: {
          rating: { average: 0, count: 0 },
          orders: 0,
          responseTime: '24 hours'
        }
      };

      console.log('Submitting service data:', serviceData);
      
      const response = await createService(serviceData);
      console.log('Service created successfully:', response);
      
      // Redirect to vendor jobs dashboard
      navigate('/vendor/jobs');
    } catch (error) {
      console.error('Error creating service:', error);
      
      // Better error handling
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        navigate('/login');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to create services. Make sure you are logged in as a vendor.');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Failed to create service. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading if authentication is still being checked
  if (authLoading) {
    return (
      <div className="create-service-page">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-service-page">
      <div className="container">
        <div className="create-service-header">
          <h2>Create New Service</h2>
          <p>Share your skills and start earning money</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="create-service-form">
          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="title">Service Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="I will create a professional website for your business"
                required
                maxLength="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your service in detail..."
                rows="4"
                required
                maxLength="2000"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="deliveryTime">Delivery Time (days) *</label>
                <input
                  type="number"
                  id="deliveryTime"
                  name="deliveryTime"
                  value={formData.deliveryTime}
                  onChange={handleChange}
                  min="1"
                  max="365"
                  required
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="form-section">
            <h3>Pricing</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pricing.type">Pricing Type</label>
                <select
                  id="pricing.type"
                  name="pricing.type"
                  value={formData.pricing.type}
                  onChange={handleChange}
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="hourly">Hourly Rate</option>
                  <option value="package">Package Based</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="pricing.amount">
                  {formData.pricing.type === 'hourly' ? 'Hourly Rate ($)' : 'Starting Price ($)'} *
                </label>
                <input
                  type="number"
                  id="pricing.amount"
                  name="pricing.amount"
                  value={formData.pricing.amount}
                  onChange={handleChange}
                  min="5"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="form-section">
            <h3>Service Location</h3>
            
            <div className="form-group">
              <label htmlFor="location.type">Location Type</label>
              <select
                id="location.type"
                name="location.type"
                value={formData.location.type}
                onChange={handleChange}
              >
                <option value="remote">Remote/Online</option>
                <option value="in_person">In Person</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            {formData.location.type !== 'remote' && (
              <div className="form-group">
                <label htmlFor="location.address">Service Area</label>
                <input
                  type="text"
                  id="location.address"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleChange}
                  placeholder="City, State or specific area"
                />
              </div>
            )}
          </div>

          {/* Requirements */}
          <div className="form-section">
            <h3>Requirements</h3>
            <p className="section-description">What do you need from the buyer to get started?</p>
            
            {formData.requirements.map((req, index) => (
              <div key={index} className="array-input">
                <input
                  type="text"
                  value={req}
                  onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                  placeholder={`Requirement ${index + 1}`}
                  maxLength="200"
                />
                {formData.requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayField('requirements', index)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayField('requirements')}
              className="add-btn"
            >
              Add Requirement
            </button>
          </div>

          {/* Deliverables */}
          <div className="form-section">
            <h3>Deliverables</h3>
            <p className="section-description">What will the buyer receive?</p>
            
            {formData.deliverables.map((del, index) => (
              <div key={index} className="array-input">
                <input
                  type="text"
                  value={del}
                  onChange={(e) => handleArrayChange('deliverables', index, e.target.value)}
                  placeholder={`Deliverable ${index + 1}`}
                  maxLength="200"
                />
                {formData.deliverables.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayField('deliverables', index)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayField('deliverables')}
              className="add-btn"
            >
              Add Deliverable
            </button>
          </div>

          {/* Tags */}
          <div className="form-section">
            <h3>Tags</h3>
            <div className="form-group">
              <label htmlFor="tags">Service Tags (comma separated)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="web design, responsive, modern, business"
              />
              <small>Enter keywords that describe your service, separated by commas</small>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/vendor/jobs')}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating Service...' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateService; 