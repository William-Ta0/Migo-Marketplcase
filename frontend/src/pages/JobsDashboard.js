import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getJobs, getJobStats } from '../api/jobApi';
import { useAuth } from '../context/AuthContext';
import '../styles/JobsDashboard.css';

const JobsDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('customer'); // customer or vendor
  const [filters, setFilters] = useState({
    status: 'all',
    page: 1,
    limit: 10
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch jobs and stats
      const [jobsResponse, statsResponse] = await Promise.all([
        getJobs({ ...filters, role: activeTab }),
        getJobStats(activeTab)
      ]);

      if (jobsResponse.success) {
        setJobs(jobsResponse.data);
      }

      if (statsResponse.success) {
        setStats(statsResponse.data.stats);
      }
    } catch (err) {
      setError('Failed to load jobs data');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (job) => {
    const amount = job.selectedPackage?.price || job.pricing?.amount || 0;
    return `$${amount}`;
  };

  if (loading) {
    return (
      <div className="jobs-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="jobs-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h1>Jobs Dashboard</h1>
          <p>Manage your bookings and orders</p>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab ${activeTab === 'customer' ? 'active' : ''}`}
            onClick={() => setActiveTab('customer')}
          >
            As Customer
          </button>
          <button 
            className={`tab ${activeTab === 'vendor' ? 'active' : ''}`}
            onClick={() => setActiveTab('vendor')}
          >
            As Vendor
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>{stats.total || 0}</h3>
              <p>Total Jobs</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <h3>{stats.pending || 0}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔄</div>
            <div className="stat-info">
              <h3>{stats.in_progress || 0}</h3>
              <p>In Progress</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{stats.completed || 0}</h3>
              <p>Completed</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <h3>${stats.totalRevenue || 0}</h3>
              <p>Total Value</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="filter-group">
            <label htmlFor="status-filter">Status:</label>
            <select 
              id="status-filter"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Jobs List */}
        <div className="jobs-section">
          <h2>
            {activeTab === 'customer' ? 'Your Bookings' : 'Your Orders'}
            <span className="count">({jobs.length})</span>
          </h2>

          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={fetchData} className="retry-btn">
                Try Again
              </button>
            </div>
          )}

          {jobs.length === 0 && !error ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No jobs found</h3>
              <p>
                {activeTab === 'customer' 
                  ? "You haven't made any bookings yet."
                  : "You don't have any orders yet."
                }
              </p>
              <Link 
                to="/categories" 
                className="btn btn-primary"
              >
                Browse Services
              </Link>
            </div>
          ) : (
            <div className="jobs-list">
              {jobs.map((job) => (
                <div key={job._id} className="job-card">
                  <div className="job-header">
                    <div className="job-info">
                      <h3>{job.title}</h3>
                      <p className="job-id">Job #{job.jobNumber || job._id.slice(-8)}</p>
                    </div>
                    <div 
                      className="job-status"
                      style={{ backgroundColor: getStatusColor(job.status) }}
                    >
                      {getStatusText(job.status)}
                    </div>
                  </div>

                  <div className="job-details">
                    <div className="job-parties">
                      {activeTab === 'customer' ? (
                        <div className="party-info">
                          <span className="label">Vendor:</span>
                          <div className="party">
                            {job.vendor.avatar && (
                              <img src={job.vendor.avatar} alt={job.vendor.name} />
                            )}
                            <span>{job.vendor.name}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="party-info">
                          <span className="label">Customer:</span>
                          <div className="party">
                            {job.customer.avatar && (
                              <img src={job.customer.avatar} alt={job.customer.name} />
                            )}
                            <span>{job.customer.name}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="job-meta">
                      <div className="meta-item">
                        <span className="label">Service:</span>
                        <span>{job.service.title}</span>
                      </div>
                      {job.selectedPackage && (
                        <div className="meta-item">
                          <span className="label">Package:</span>
                          <span>{job.selectedPackage.name}</span>
                        </div>
                      )}
                      <div className="meta-item">
                        <span className="label">Value:</span>
                        <span className="price">{formatPrice(job)}</span>
                      </div>
                      <div className="meta-item">
                        <span className="label">Created:</span>
                        <span>{formatDate(job.createdAt)}</span>
                      </div>
                      {job.scheduling.preferredDate && (
                        <div className="meta-item">
                          <span className="label">Preferred Date:</span>
                          <span>{formatDate(job.scheduling.preferredDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="job-actions">
                    <Link 
                      to={`/jobs/${job._id}`} 
                      className="btn btn-primary"
                    >
                      View Details
                    </Link>
                    {job.status === 'pending' && activeTab === 'customer' && (
                      <button className="btn btn-secondary">
                        Cancel
                      </button>
                    )}
                    {job.status === 'pending' && activeTab === 'vendor' && (
                      <>
                        <button className="btn btn-success">
                          Accept
                        </button>
                        <button className="btn btn-danger">
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobsDashboard; 