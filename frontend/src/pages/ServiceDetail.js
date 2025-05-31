import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getServiceById } from '../api/serviceApi';
import { createJob } from '../api/jobApi';
import { useAuth } from '../context/AuthContext';
import '../styles/ServiceDetail.css';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    message: '',
    preferredDate: '',
    urgency: 'normal'
  });

  useEffect(() => {
    if (id) {
      fetchService();
    }
  }, [id]);

  const fetchService = async () => {
    try {
      setLoading(true);
      const response = await getServiceById(id);
      if (response.success) {
        setService(response.data);
        // Set first package as default for package pricing
        if (response.data.pricing.type === 'package' && response.data.pricing.packages?.length > 0) {
          setSelectedPackage(response.data.pricing.packages[0]);
        }
      } else {
        setError('Service not found');
      }
    } catch (err) {
      setError('Error loading service details');
      console.error('Error fetching service:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (!bookingData.message.trim()) {
      alert('Please provide a message describing your needs');
      return;
    }

    try {
      setBookingLoading(true);

      const jobData = {
        serviceId: service._id,
        vendorId: service.vendor._id,
        message: bookingData.message,
        preferredDate: bookingData.preferredDate,
        urgency: bookingData.urgency,
        selectedPackage: selectedPackage,
        location: {
          address: null, // Can be expanded later
          specialInstructions: ''
        }
      };

      const response = await createJob(jobData);
      
      if (response.success) {
        setShowBookingModal(false);
        // Reset form
        setBookingData({
          message: '',
          preferredDate: '',
          urgency: 'normal'
        });
        
        // Show success and redirect to jobs page
        alert('Booking request sent successfully! The vendor will respond soon.');
        navigate('/jobs'); // We'll create this page next
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert(error.message || 'Failed to send booking request. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatPrice = (service, packageData = null) => {
    if (service.pricing.type === 'custom') {
      return 'Get Quote';
    }
    
    const currency = service.pricing.currency || 'USD';
    const symbol = currency === 'USD' ? '$' : currency;
    
    if (packageData) {
      return `${symbol}${packageData.price}`;
    }
    
    const amount = service.pricing.amount;
    switch (service.pricing.type) {
      case 'hourly':
        return `${symbol}${amount}/hr`;
      case 'fixed':
        return `${symbol}${amount}`;
      case 'package':
        return `Starting at ${symbol}${amount}`;
      default:
        return `${symbol}${amount}`;
    }
  };

  const getDeliveryTime = (packageData = null) => {
    if (packageData && packageData.deliveryTime) {
      return `${packageData.deliveryTime} days`;
    }
    
    if (service.estimatedDuration) {
      const { min, max, unit } = service.estimatedDuration;
      if (min === max) {
        return `${min} ${unit}`;
      }
      return `${min}-${max} ${unit}`;
    }
    
    return 'Contact for timeline';
  };

  if (loading) {
    return (
      <div className="service-detail">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading service details...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="service-detail">
        <div className="error-container">
          <h2>Service Not Found</h2>
          <p>{error || 'The service you\'re looking for doesn\'t exist.'}</p>
          <Link to="/categories" className="btn btn-primary">
            Browse Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="service-detail">
      {/* Header Section */}
      <div className="service-header">
        <div className="header-content">
          <div className="breadcrumb">
            <Link to="/categories">Categories</Link>
            <span className="separator">•</span>
            <Link to={`/services/category/${service.category.slug}`}>
              {service.category.name}
            </Link>
            <span className="separator">•</span>
            <span className="current">{service.title}</span>
          </div>

          <div className="service-hero">
            <div className="service-images">
              <div className="main-image">
                {service.images && service.images.length > 0 ? (
                  <img 
                    src={service.images[selectedImageIndex]?.url} 
                    alt={service.images[selectedImageIndex]?.alt || service.title}
                  />
                ) : (
                  <div className="no-image">
                    <span>📷</span>
                    <p>No Image Available</p>
                  </div>
                )}
                {service.isPromoted && (
                  <div className="featured-badge">Featured Service</div>
                )}
              </div>
              
              {service.images && service.images.length > 1 && (
                <div className="image-thumbnails">
                  {service.images.map((image, index) => (
                    <button
                      key={index}
                      className={`thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <img src={image.url} alt={`${service.title} ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="service-info">
              <div className="service-meta">
                <span className="category" style={{ backgroundColor: service.category.color || '#3B82F6' }}>
                  {service.category.icon} {service.subcategory.name}
                </span>
                <div className="rating">
                  <span className="stars">
                    {'⭐'.repeat(Math.floor(service.displayRating || 0))}
                  </span>
                  <span className="rating-text">
                    {service.displayRating || '0.0'} ({service.reviewCount || 0} reviews)
                  </span>
                </div>
              </div>

              <h1>{service.title}</h1>
              <p className="short-description">{service.shortDescription}</p>

              {/* Pricing */}
              <div className="pricing-section">
                {service.pricing.type === 'package' && service.pricing.packages ? (
                  <div className="package-pricing">
                    <h3>Choose a Package</h3>
                    <div className="packages">
                      {service.pricing.packages.map((pkg, index) => (
                        <div 
                          key={index}
                          className={`package-card ${selectedPackage?.name === pkg.name ? 'selected' : ''}`}
                          onClick={() => setSelectedPackage(pkg)}
                        >
                          <div className="package-header">
                            <h4>{pkg.name}</h4>
                            <div className="package-price">${pkg.price}</div>
                          </div>
                          <p>{pkg.description}</p>
                          <ul className="package-features">
                            {pkg.features.map((feature, fIndex) => (
                              <li key={fIndex}>✓ {feature}</li>
                            ))}
                          </ul>
                          <div className="delivery-time">
                            Delivery: {pkg.deliveryTime} days
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="simple-pricing">
                    <div className="price-display">
                      <span className="price">{formatPrice(service)}</span>
                      <span className="price-type">{service.pricing.type}</span>
                    </div>
                    {service.pricing.customNote && (
                      <p className="price-note">{service.pricing.customNote}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowBookingModal(true)}
                >
                  {service.pricing.type === 'custom' ? 'Get Quote' : 'Book Now'}
                </button>
                <button className="btn btn-secondary">
                  💬 Contact Vendor
                </button>
                <button className="btn btn-outline">
                  ❤️ Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="service-content">
        <div className="content-container">
          <div className="main-content">
            {/* Description */}
            <section className="service-section">
              <h2>About This Service</h2>
              <div className="description">
                {service.description.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>

            {/* Features */}
            {service.features && service.features.length > 0 && (
              <section className="service-section">
                <h2>What's Included</h2>
                <div className="features-grid">
                  {service.features.map((feature, index) => (
                    <div key={index} className="feature-item">
                      <span className="check">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Requirements */}
            {service.requirements && service.requirements.length > 0 && (
              <section className="service-section">
                <h2>Requirements</h2>
                <ul className="requirements-list">
                  {service.requirements.map((requirement, index) => (
                    <li key={index}>{requirement}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Deliverables */}
            {service.deliverables && service.deliverables.length > 0 && (
              <section className="service-section">
                <h2>What You'll Get</h2>
                <ul className="deliverables-list">
                  {service.deliverables.map((deliverable, index) => (
                    <li key={index}>{deliverable}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Location & Availability */}
            <section className="service-section">
              <h2>Service Details</h2>
              <div className="service-details-grid">
                <div className="detail-item">
                  <h4>Service Type</h4>
                  <p className="capitalize">{service.location.type}</p>
                </div>
                <div className="detail-item">
                  <h4>Service Area</h4>
                  <div className="service-area">
                    {service.location.serviceArea.cities && (
                      <p>Cities: {service.location.serviceArea.cities.join(', ')}</p>
                    )}
                    {service.location.serviceArea.states && (
                      <p>States: {service.location.serviceArea.states.join(', ')}</p>
                    )}
                    {service.location.serviceArea.radius && (
                      <p>Radius: {service.location.serviceArea.radius} miles</p>
                    )}
                  </div>
                </div>
                <div className="detail-item">
                  <h4>Response Time</h4>
                  <p>{service.availability?.leadTime || 1} days</p>
                </div>
                <div className="detail-item">
                  <h4>Duration</h4>
                  <p>{getDeliveryTime(selectedPackage)}</p>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="sidebar">
            {/* Vendor Card */}
            <div className="vendor-card">
              <div className="vendor-header">
                <div className="vendor-avatar">
                  {service.vendor.avatar ? (
                    <img src={service.vendor.avatar} alt={service.vendor.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {service.vendor.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="vendor-info">
                  <h3>{service.vendor.name}</h3>
                  <p className="vendor-title">Professional Service Provider</p>
                  {service.vendor.address && (
                    <p className="vendor-location">
                      📍 {service.vendor.address.city}, {service.vendor.address.state}
                    </p>
                  )}
                </div>
              </div>
              
              {service.vendor.bio && (
                <div className="vendor-bio">
                  <p>{service.vendor.bio}</p>
                </div>
              )}

              <div className="vendor-stats">
                <div className="stat">
                  <span className="stat-value">{service.stats.rating.average.toFixed(1)}</span>
                  <span className="stat-label">Rating</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{service.stats.bookings}</span>
                  <span className="stat-label">Orders</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{service.stats.views}</span>
                  <span className="stat-label">Views</span>
                </div>
              </div>

              <div className="vendor-actions">
                <button className="btn btn-outline">View Profile</button>
                <button className="btn btn-secondary">Send Message</button>
              </div>
            </div>

            {/* Service Stats */}
            <div className="service-stats-card">
              <h3>Service Statistics</h3>
              <div className="stats-list">
                <div className="stat-row">
                  <span>Views</span>
                  <span>{service.stats.views}</span>
                </div>
                <div className="stat-row">
                  <span>Inquiries</span>
                  <span>{service.stats.inquiries}</span>
                </div>
                <div className="stat-row">
                  <span>Completed Orders</span>
                  <span>{service.stats.bookings}</span>
                </div>
                <div className="stat-row">
                  <span>Member Since</span>
                  <span>{new Date(service.vendor.createdAt).getFullYear()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Services */}
      {service.relatedServices && service.relatedServices.length > 0 && (
        <div className="related-services">
          <div className="container">
            <h2>Related Services</h2>
            <div className="related-services-grid">
              {service.relatedServices.map((relatedService) => (
                <Link 
                  key={relatedService._id}
                  to={`/services/${relatedService._id}`}
                  className="related-service-card"
                >
                  <div className="service-image">
                    {relatedService.primaryImage ? (
                      <img 
                        src={relatedService.primaryImage.url} 
                        alt={relatedService.title}
                      />
                    ) : (
                      <div className="no-image">📷</div>
                    )}
                  </div>
                  <div className="service-content">
                    <h4>{relatedService.title}</h4>
                    <p>{relatedService.shortDescription}</p>
                    <div className="service-price">
                      {formatPrice(relatedService)}
                    </div>
                    <div className="service-rating">
                      ⭐ {relatedService.displayRating} ({relatedService.stats?.rating?.count || 0})
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Book Service</h3>
              <button 
                className="close-btn"
                onClick={() => setShowBookingModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <div className="booking-summary">
                <h4>{service.title}</h4>
                {selectedPackage && (
                  <div className="selected-package">
                    <p><strong>{selectedPackage.name}</strong> - ${selectedPackage.price}</p>
                    <p>{selectedPackage.description}</p>
                  </div>
                )}
                <p>by {service.vendor.name}</p>
              </div>
              
              <form onSubmit={handleBookingSubmit} className="booking-form">
                <div className="form-group">
                  <label htmlFor="message">Message to Vendor</label>
                  <textarea
                    id="message"
                    value={bookingData.message}
                    onChange={(e) => setBookingData({...bookingData, message: e.target.value})}
                    placeholder="Describe your needs and any specific requirements..."
                    rows="4"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="preferredDate">Preferred Start Date</label>
                  <input
                    type="date"
                    id="preferredDate"
                    value={bookingData.preferredDate}
                    onChange={(e) => setBookingData({...bookingData, preferredDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="urgency">Urgency</label>
                  <select
                    id="urgency"
                    value={bookingData.urgency}
                    onChange={(e) => setBookingData({...bookingData, urgency: e.target.value})}
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
                
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowBookingModal(false)}
                    disabled={bookingLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? 'Sending...' : 'Send Booking Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDetail; 