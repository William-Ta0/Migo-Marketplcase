import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobById, updateJobStatus, addJobMessage, uploadJobFile } from '../api/jobApi';
import { useAuth } from '../context/AuthContext';
import JobStatusManager from '../components/JobStatusManager';
import JobMessaging from '../components/JobMessaging';
import JobFiles from '../components/JobFiles';
import '../styles/JobDetail.css';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchJobDetail();
  }, [id]);

  const fetchJobDetail = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getJobById(id);
      if (response.success) {
        setJob(response.data);
      } else {
        setError(response.message || 'Failed to load job details');
      }
    } catch (err) {
      setError('Failed to load job details');
      console.error('Error fetching job detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus, reason, additionalData = {}) => {
    try {
      const response = await updateJobStatus(id, newStatus, reason, additionalData);
      if (response.success) {
        setJob(response.data.job);
        // Show success message
        alert('Job status updated successfully!');
      } else {
        alert(response.message || 'Failed to update status');
      }
    } catch (err) {
      alert('Failed to update job status');
      console.error('Error updating status:', err);
    }
  };

  const handleMessageSend = async (message) => {
    try {
      const response = await addJobMessage(id, message);
      if (response.success) {
        // Refresh job to get updated messages
        await fetchJobDetail();
      } else {
        alert(response.message || 'Failed to send message');
      }
    } catch (err) {
      alert('Failed to send message');
      console.error('Error sending message:', err);
    }
  };

  const handleFileUpload = async (file) => {
    try {
      const response = await uploadJobFile(id, file);
      if (response.success) {
        // Refresh job to get updated files
        await fetchJobDetail();
      } else {
        alert(response.message || 'Failed to upload file');
      }
    } catch (err) {
      alert('Failed to upload file');
      console.error('Error uploading file:', err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',
      'reviewing': '#3b82f6',
      'quoted': '#8b5cf6',
      'accepted': '#10b981',
      'confirmed': '#059669',
      'in_progress': '#0ea5e9',
      'completed': '#22c55e',
      'delivered': '#16a34a',
      'cancelled': '#ef4444',
      'disputed': '#dc2626',
      'closed': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      'pending': 'Pending Review',
      'reviewing': 'Under Review',
      'quoted': 'Quote Provided',
      'accepted': 'Accepted',
      'confirmed': 'Confirmed',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'disputed': 'Disputed',
      'closed': 'Closed'
    };
    return statusTexts[status] || status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="job-detail">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="job-detail">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error || 'Job not found'}</p>
          <button onClick={() => navigate('/jobs')} className="btn btn-primary">
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const isVendor = job.vendor._id === user?.uid || job.vendor.firebaseUid === user?.uid;
  const isCustomer = job.customer._id === user?.uid || job.customer.firebaseUid === user?.uid;

  return (
    <div className="job-detail">
      <div className="job-detail-container">
        {/* Header */}
        <div className="job-header">
          <div className="job-header-content">
            <div className="job-title-section">
              <h1>{job.title}</h1>
              <p className="job-id">Job #{job.jobNumber || job._id.slice(-8).toUpperCase()}</p>
            </div>
            <div className="job-status-badge" style={{ backgroundColor: getStatusColor(job.status) }}>
              {getStatusText(job.status)}
            </div>
          </div>
          <div className="job-header-actions">
            <button onClick={() => navigate('/jobs')} className="btn btn-secondary">
              ← Back to Jobs
            </button>
          </div>
        </div>

        {/* Status Progress */}
        <div className="status-progress">
          <div className="progress-bar">
            {['pending', 'confirmed', 'in_progress', 'completed', 'delivered'].map((status, index) => (
              <div
                key={status}
                className={`progress-step ${
                  ['pending', 'confirmed', 'in_progress', 'completed', 'delivered'].indexOf(job.status) >= index
                    ? 'active'
                    : ''
                }`}
              >
                <div className="step-circle">
                  {['pending', 'confirmed', 'in_progress', 'completed', 'delivered'].indexOf(job.status) > index ? '✓' : index + 1}
                </div>
                <span className="step-label">{getStatusText(status)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="job-tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab ${activeTab === 'status' ? 'active' : ''}`}
            onClick={() => setActiveTab('status')}
          >
            Status Management
          </button>
          <button
            className={`tab ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            Messages ({job.messages?.length || 0})
          </button>
          <button
            className={`tab ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            Files & Attachments
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="overview-grid">
                {/* Job Information */}
                <div className="info-card">
                  <h3>Job Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Service:</label>
                      <span>{job.service?.title}</span>
                    </div>
                    <div className="info-item">
                      <label>Category:</label>
                      <span>{job.service?.category}</span>
                    </div>
                    <div className="info-item">
                      <label>Description:</label>
                      <span>{job.description}</span>
                    </div>
                    {job.selectedPackage && (
                      <div className="info-item">
                        <label>Package:</label>
                        <span>{job.selectedPackage.name}</span>
                      </div>
                    )}
                    <div className="info-item">
                      <label>Urgency:</label>
                      <span className={`urgency-badge ${job.urgency}`}>
                        {job.urgency?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Parties Information */}
                <div className="info-card">
                  <h3>Parties</h3>
                  <div className="parties-grid">
                    <div className="party-info">
                      <label>Customer:</label>
                      <div className="party-details">
                        {job.customer.avatar && (
                          <img src={job.customer.avatar} alt={job.customer.name} className="avatar" />
                        )}
                        <div>
                          <div className="party-name">{job.customer.name}</div>
                          <div className="party-email">{job.customer.email}</div>
                        </div>
                      </div>
                    </div>
                    <div className="party-info">
                      <label>Vendor:</label>
                      <div className="party-details">
                        {job.vendor.avatar && (
                          <img src={job.vendor.avatar} alt={job.vendor.name} className="avatar" />
                        )}
                        <div>
                          <div className="party-name">{job.vendor.name}</div>
                          <div className="party-email">{job.vendor.email}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Information */}
                <div className="info-card">
                  <h3>Pricing</h3>
                  <div className="pricing-grid">
                    <div className="pricing-item">
                      <label>Type:</label>
                      <span>{job.pricing?.type}</span>
                    </div>
                    <div className="pricing-item">
                      <label>Amount:</label>
                      <span className="price">{formatPrice(job.pricing?.amount || 0, job.pricing?.currency)}</span>
                    </div>
                    {job.pricing?.estimatedTotal && (
                      <div className="pricing-item">
                        <label>Estimated Total:</label>
                        <span className="price">{formatPrice(job.pricing.estimatedTotal, job.pricing?.currency)}</span>
                      </div>
                    )}
                    {job.pricing?.finalTotal && (
                      <div className="pricing-item">
                        <label>Final Total:</label>
                        <span className="price final">{formatPrice(job.pricing.finalTotal, job.pricing?.currency)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scheduling Information */}
                <div className="info-card">
                  <h3>Scheduling</h3>
                  <div className="scheduling-grid">
                    <div className="scheduling-item">
                      <label>Created:</label>
                      <span>{formatDate(job.createdAt)}</span>
                    </div>
                    {job.scheduling?.preferredDate && (
                      <div className="scheduling-item">
                        <label>Preferred Date:</label>
                        <span>{formatDate(job.scheduling.preferredDate)}</span>
                      </div>
                    )}
                    {job.scheduling?.confirmedDate && (
                      <div className="scheduling-item">
                        <label>Confirmed Date:</label>
                        <span>{formatDate(job.scheduling.confirmedDate)}</span>
                      </div>
                    )}
                    {job.scheduling?.estimatedStartTime && (
                      <div className="scheduling-item">
                        <label>Estimated Time:</label>
                        <span>{job.scheduling.estimatedStartTime} - {job.scheduling.estimatedEndTime}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Information */}
                {job.location && (
                  <div className="info-card">
                    <h3>Location</h3>
                    <div className="location-grid">
                      <div className="location-item">
                        <label>Type:</label>
                        <span>{job.location.type}</span>
                      </div>
                      {job.location.address && (
                        <div className="location-item">
                          <label>Address:</label>
                          <span>
                            {job.location.address.street}, {job.location.address.city}, {job.location.address.state} {job.location.address.zipCode}
                          </span>
                        </div>
                      )}
                      {job.location.meetingLink && (
                        <div className="location-item">
                          <label>Meeting Link:</label>
                          <a href={job.location.meetingLink} target="_blank" rel="noopener noreferrer">
                            {job.location.meetingLink}
                          </a>
                        </div>
                      )}
                      {job.location.specialInstructions && (
                        <div className="location-item">
                          <label>Special Instructions:</label>
                          <span>{job.location.specialInstructions}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'status' && (
            <JobStatusManager
              job={job}
              isVendor={isVendor}
              isCustomer={isCustomer}
              onStatusUpdate={handleStatusUpdate}
            />
          )}

          {activeTab === 'messages' && (
            <JobMessaging
              job={job}
              currentUser={user}
              onMessageSend={handleMessageSend}
            />
          )}

          {activeTab === 'files' && (
            <JobFiles
              job={job}
              isVendor={isVendor}
              isCustomer={isCustomer}
              onFileUpload={handleFileUpload}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetail; 