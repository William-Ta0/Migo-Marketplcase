import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getJobs, getJobStats } from '../api/jobApi';
import { useAuth } from '../context/AuthContext';
import { onSnapshot, query, collection, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import '../styles/CustomerJobTracker.css';

// Mock data for testing when backend is not available
const mockJobs = [
  {
    _id: 'mock-job-1',
    title: 'Website Design & Development',
    jobNumber: 'MG001234',
    status: 'in_progress',
    vendor: {
      name: 'Dummy',
      email: 'zhengxin.uni.backup@gmail.com',
      firebaseUid: 'KYoHpznowHNwWAEg2343bDhoCux2'
    },
    customer: {
      firebaseUid: 'current-user'
    },
    selectedPackage: {
      name: 'Premium Package',
      price: 1500,
      deliveryTime: '7'
    },
    pricing: {
      amount: 1500
    },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    estimatedCompletionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    description: 'Complete website redesign with modern UI/UX'
  },
  {
    _id: 'mock-job-2',
    title: 'Logo Design',
    jobNumber: 'MG001235',
    status: 'completed',
    vendor: {
      name: 'Dummy',
      email: 'zhengxin.uni.backup@gmail.com',
      firebaseUid: 'KYoHpznowHNwWAEg2343bDhoCux2'
    },
    customer: {
      firebaseUid: 'current-user'
    },
    selectedPackage: {
      name: 'Basic Package',
      price: 250,
      deliveryTime: '3'
    },
    pricing: {
      amount: 250
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    description: 'Professional logo design for startup company'
  },
  {
    _id: 'mock-job-3',
    title: 'Mobile App Development',
    jobNumber: 'MG001236',
    status: 'quoted',
    vendor: {
      name: 'Dummy',
      email: 'zhengxin.uni.backup@gmail.com',
      firebaseUid: 'KYoHpznowHNwWAEg2343bDhoCux2'
    },
    customer: {
      firebaseUid: 'current-user'
    },
    selectedPackage: {
      name: 'Enterprise Package',
      price: 5000,
      deliveryTime: '30'
    },
    pricing: {
      amount: 5000
    },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    description: 'Full-stack mobile application development'
  }
];

const mockStats = {
  active: 1,
  pending: 0,
  completed: 1,
  totalSpent: 1750
};

// Filter options for the new UI
const filterOptions = [
  { key: 'all', label: 'All Jobs' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const CustomerJobTracker = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [realTimeJobs, setRealTimeJobs] = useState(new Map());

  useEffect(() => {
    fetchJobs();
    setupRealTimeListener();
  }, [user]);

  const fetchJobs = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching jobs for user:', user.uid);
      
      // Use the proper getJobs API function instead of direct fetch
      const response = await getJobs({ role: 'customer' });
      
      if (response && response.success && response.data) {
        console.log('✅ Real job data loaded successfully:', response.data);
        setJobs(response.data);
        console.log('📊 Using real API data');
      } else {
        // No jobs found (not an error)
        console.log('ℹ️ No jobs found, showing empty state');
        setJobs([]);
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch real job data:', error);
      console.log('🔄 Using mock data for demonstration');
      
      // Only show error and use mock data on actual API failure
      setError('Demo Mode: Unable to connect to server. Showing sample data.');
      setJobs(mockJobs);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const setupRealTimeListener = () => {
    if (!user?.uid) return;

    try {
      // Set up Firebase real-time listener for job updates
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('customer.firebaseUid', '==', user.uid),
        orderBy('updatedAt', 'desc')
      );

      const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
        const updatedJobs = new Map();
        snapshot.forEach((doc) => {
          updatedJobs.set(doc.id, {
            id: doc.id,
            ...doc.data(),
            lastUpdated: new Date()
          });
        });
        setRealTimeJobs(updatedJobs);
      }, (error) => {
        console.error('Real-time listener error:', error);
      });

      return () => unsubscribe();
    } catch (error) {
      console.warn('Firebase real-time listener not available:', error);
    }
  };

  const getJobWithRealTimeData = (job) => {
    if (error) return job;
    const realTimeData = realTimeJobs.get(job._id);
    return realTimeData ? { ...job, ...realTimeData } : job;
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

  const getStatusProgress = (status) => {
    const statusOrder = ['pending', 'confirmed', 'in_progress', 'completed', 'delivered'];
    const currentIndex = statusOrder.indexOf(status);
    return currentIndex >= 0 ? ((currentIndex + 1) / statusOrder.length) * 100 : 0;
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
      currency: 'USD'
    }).format(amount);
  };

  const getNextAction = (job) => {
    const actions = {
      'pending': 'Waiting for vendor review',
      'reviewing': 'Vendor is reviewing your request',
      'quoted': 'Review and accept the quote',
      'accepted': 'Waiting for vendor confirmation',
      'confirmed': 'Job confirmed, work will begin soon',
      'in_progress': 'Work is in progress',
      'completed': 'Work completed, awaiting delivery',
      'delivered': 'Job delivered successfully',
      'cancelled': 'Job was cancelled',
      'disputed': 'Issue needs resolution',
      'closed': 'Job completed and closed'
    };
    return actions[job.status] || 'Status update pending';
  };

  const getTimeElapsed = (job) => {
    const now = new Date();
    const created = new Date(job.createdAt);
    const diffHours = Math.floor((now - created) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  const getEstimatedCompletion = (job) => {
    if (job.estimatedCompletionDate) {
      return formatDate(job.estimatedCompletionDate);
    }
    if (job.selectedPackage?.deliveryTime) {
      const deliveryDays = parseInt(job.selectedPackage.deliveryTime);
      const completionDate = new Date(job.createdAt);
      completionDate.setDate(completionDate.getDate() + deliveryDays);
      return formatDate(completionDate);
    }
    return 'TBD';
  };

  // Calculate statistics from current jobs data (real or mock)
  const stats = useMemo(() => {
    const activeJobs = jobs.filter(job => job.status === 'in_progress' || job.status === 'confirmed');
    const pendingJobs = jobs.filter(job => job.status === 'pending' || job.status === 'quoted');
    const completedJobs = jobs.filter(job => job.status === 'completed');
    const totalSpent = completedJobs.reduce((sum, job) => sum + (job.pricing?.amount || 0), 0);

    return {
      active: activeJobs.length,
      pending: pendingJobs.length,
      completed: completedJobs.length,
      totalSpent: totalSpent
    };
  }, [jobs]);

  // Filter jobs based on active filter
  const filteredJobs = useMemo(() => {
    if (activeFilter === 'all') return jobs;
    return jobs.filter(job => job.status === activeFilter);
  }, [jobs, activeFilter]);

  // Handle job card click
  const handleJobClick = (job) => {
    // Navigate to the existing JobDetail page
    window.location.href = `/jobs/${job._id}`;
  };

  // Calculate job progress percentage based on status
  const getJobProgress = (status) => {
    const progressMap = {
      'pending': 10,
      'quoted': 25,
      'reviewing': 25,
      'confirmed': 40,
      'in_progress': 60,
      'completed': 100,
      'cancelled': 0
    };
    return progressMap[status] || 0;
  };

  if (loading) {
    return (
      <div className="customer-job-tracker">
        <div className="job-tracker-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-job-tracker">
      <div className="job-tracker-container">
        <div className="tracker-header">
          <h1 className="page-title">My Job Tracker</h1>
          <p className="page-subtitle">Track all your service requests and their progress</p>
          
          {/* Only show demo notice if we're using mock data due to error */}
          {error && (
            <div className="demo-notice">
              <span className="demo-icon">⚠️</span>
              <span className="demo-text">{error}</span>
            </div>
          )}
        </div>

        {/* Rest of the component remains the same */}
        <div className="stats-grid">
          <div className="stat-card active">
            <div className="stat-number">{stats.active}</div>
            <div className="stat-label">Active Jobs</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card completed">
            <div className="stat-number">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card spent">
            <div className="stat-number">${stats.totalSpent.toLocaleString()}</div>
            <div className="stat-label">Total Spent</div>
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-tabs">
            {filterOptions.map(filter => (
              <button
                key={filter.key}
                className={`filter-tab ${activeFilter === filter.key ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="jobs-list">
          {filteredJobs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No jobs found</h3>
              <p>
                {activeFilter === 'all' 
                  ? "You haven't booked any services yet. Browse our services to get started!"
                  : `No ${activeFilter} jobs found. Try adjusting your filter.`
                }
              </p>
              <button className="browse-services-btn" onClick={() => window.location.href = '/services'}>
                Browse Services
              </button>
            </div>
          ) : (
            <div className="jobs-grid">
              {filteredJobs.map(job => (
                <div key={job._id} className="job-card" onClick={() => handleJobClick(job)}>
                  <div className="job-header">
                    <h3 className="job-title">{job.title}</h3>
                    <span className={`status-badge ${job.status}`}>
                      {job.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  
                  <div className="job-meta">
                    <div className="job-number">#{job.jobNumber}</div>
                    <div className="job-date">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="job-details">
                    <p className="job-description">{job.description}</p>
                    <div className="job-service">
                      <span className="service-category">
                        {job.service?.category?.name || job.service?.category || 'Uncategorized'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="job-footer-simple">
                    <div className="vendor-name-only">
                      Vendor: {job.vendor?.name || 'TBD'}
                    </div>
                    <div className="job-price">
                      ${job.pricing?.amount?.toLocaleString() || 'TBD'}
                    </div>
                  </div>
                  
                  <div className="job-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${getJobProgress(job.status)}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{getJobProgress(job.status)}% Complete</span>
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

export default CustomerJobTracker; 