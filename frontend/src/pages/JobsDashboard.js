import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getJobs, getJobStats, updateJobStatus } from '../api/jobApi';
import { useAuth } from '../context/AuthContext';
import '../styles/JobsDashboard.css';

const JobsDashboard = () => {
  const { user, userRole } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [filters, setFilters] = useState({
    status: 'all',
    page: 1,
    limit: 50
  });

  // Filter options for the new UI (same as customer dashboard)
  const filterOptions = [
    { key: 'all', label: 'All Jobs' },
    { key: 'pending', label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Always fetch vendor jobs since this page is vendor-only
      console.log('Fetching vendor jobs with filters:', filters);
      console.log('Current user:', user?.uid);
      
      // Fetch jobs and stats
      const [jobsResponse, statsResponse] = await Promise.all([
        getJobs({ ...filters, role: 'vendor' }),
        getJobStats('vendor')
      ]);

      console.log('Jobs response:', jobsResponse);
      console.log('Stats response:', statsResponse);

      if (jobsResponse && jobsResponse.success) {
        setJobs(jobsResponse.data || []);
      } else {
        console.warn('No jobs data received');
        setJobs([]);
      }

      if (statsResponse && statsResponse.success) {
        setStats(statsResponse.data?.stats || statsResponse.data || {});
      } else {
        console.warn('No stats data received');
        setStats({});
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Unable to load vendor jobs. Please check your connection and try again.');
      setJobs([]);
      setStats({});
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

  // Handle filter tab change
  const handleFilterTabChange = (filterKey) => {
    setActiveFilter(filterKey);
    setFilters(prev => ({
      ...prev,
      status: filterKey === 'all' ? 'all' : filterKey,
      page: 1
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleQuickStatusUpdate = async (jobId, newStatus) => {
    try {
      // Implement the logic to update the job status
      console.log(`Updating job ${jobId} to status ${newStatus}`);
      await updateJobStatus(jobId, newStatus);
      await fetchData(); // Refresh the job list
    } catch (err) {
      console.error('Error updating job status:', err);
      setError('Failed to update job status');
    }
  };

  // Calculate statistics with proper exclusions
  const calculatedStats = useMemo(() => {
    const activeJobs = jobs.filter(job => job.status === 'accepted');
    const pendingJobs = jobs.filter(job => job.status === 'pending');
    const completedJobs = jobs.filter(job => job.status === 'completed');
    
    // Exclude cancelled jobs from total revenue calculation
    const revenueJobs = jobs.filter(job => job.status !== 'cancelled');
    const totalRevenue = revenueJobs.reduce((sum, job) => {
      const amount = job.selectedPackage?.price || job.pricing?.amount || 0;
      return sum + amount;
    }, 0);

    return {
      total: jobs.length,
      active: activeJobs.length,
      pending: pendingJobs.length,
      completed: completedJobs.length,
      totalRevenue: totalRevenue,
      ...stats // Include any other stats from API
    };
  }, [jobs, stats]);

  // Filter jobs based on active filter
  const filteredJobs = useMemo(() => {
    if (activeFilter === 'all') return jobs;
    return jobs.filter(job => job.status === activeFilter);
  }, [jobs, activeFilter]);

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
          <h1>Vendor Jobs Dashboard</h1>
          <p>Manage your service orders and bookings</p>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>{calculatedStats.total || 0}</h3>
              <p>Total Jobs</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <h3>{calculatedStats.pending || 0}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔄</div>
            <div className="stat-info">
              <h3>{calculatedStats.active || 0}</h3>
              <p>Active</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{calculatedStats.completed || 0}</h3>
              <p>Completed</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <h3>{new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }).format(calculatedStats.totalRevenue || 0)}</h3>
              <p>Total Value</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs (same style as customer dashboard) */}
        <div className="filter-section">
          <div className="filter-tabs">
            {filterOptions.map(filter => (
              <button
                key={filter.key}
                className={`filter-tab ${activeFilter === filter.key ? 'active' : ''}`}
                onClick={() => handleFilterTabChange(filter.key)}
            >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs List */}
        <div className="jobs-section">
          <h2>
            Your Orders
            <span className="count">({filteredJobs.length})</span>
          </h2>

          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={fetchData} className="retry-btn">
                Try Again
              </button>
            </div>
          )}

          {filteredJobs.length === 0 && !error ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No jobs found</h3>
              <p>
                {activeFilter === 'all' 
                  ? "You don't have any orders yet."
                  : `No ${activeFilter} jobs found. Try adjusting your filter.`
                }
              </p>
              <Link 
                to="/services/create" 
                className="btn btn-primary"
              >
                Create Service
              </Link>
            </div>
          ) : (
            <div className="jobs-list">
              {filteredJobs.map((job) => (
                <div key={job._id} className="job-card">
                  <div className="job-header">
                    <div className="job-info">
                      <h3>{job.title}</h3>
                      <p className="job-id">Job #{job.jobNumber || job._id.slice(-8)}</p>
                    </div>
                    <div className={`status-badge status-${job.status}`}>
                      {job.status.toUpperCase()}
                    </div>
                  </div>

                  <div className="job-details">
                    <div className="job-parties">
                        <div className="party-info">
                          <span className="label">Customer:</span>
                          <div className="party">
                          <span>{job.customer?.name || 'Unknown Customer'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="job-meta">
                      <div className="meta-item">
                        <span className="label">Service:</span>
                        <span>{job.service?.title || job.title}</span>
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
                      {job.scheduling?.preferredDate && (
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
                    
                    {/* Enhanced status-based actions */}
                    {job.status === 'pending' && (
                      <div className="vendor-pending-actions">
                        <button 
                          className="btn btn-success"
                          onClick={() => handleQuickStatusUpdate(job._id, 'accepted')}
                        >
                          Accept
                        </button>
                        <button 
                          className="btn btn-danger"
                          onClick={() => handleQuickStatusUpdate(job._id, 'cancelled')}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    
                    {job.status === 'accepted' && (
                      <div className="vendor-accepted-actions">
                        <p className="status-note">Work in progress. Customer will confirm when done.</p>
                      </div>
                    )}
                    
                    {(job.status === 'completed' || job.status === 'cancelled') && (
                      <div className="job-final-status">
                        <p className="status-note">Job {job.status}</p>
                      </div>
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