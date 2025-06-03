const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://migo-backend-url.com/api' 
  : 'http://localhost:5001/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Helper function to get auth headers for file upload
const getFileUploadHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`
  };
};

// Create a new job/booking
export const createJob = async (jobData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(jobData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create booking');
    }

    return data;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

// Get jobs for current user
export const getJobs = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const response = await fetch(`${API_BASE_URL}/jobs?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch jobs');
    }

    return data;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
};

// Get a specific job by ID
export const getJobById = async (jobId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch job details');
    }

    return data;
  } catch (error) {
    console.error('Error fetching job details:', error);
    throw error;
  }
};

// Update job status
export const updateJobStatus = async (jobId, status, reason = '', additionalData = {}) => {
  try {
    const requestBody = { status, reason, ...additionalData };
    
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update job status');
    }

    return data;
  } catch (error) {
    console.error('Error updating job status:', error);
    throw error;
  }
};

// Add message to job
export const addJobMessage = async (jobId, message) => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send message');
    }

    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Upload file to job
export const uploadJobFile = async (jobId, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/upload`, {
      method: 'POST',
      headers: getFileUploadHeaders(),
      body: formData
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to upload file');
    }

    return data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Get job statistics
export const getJobStats = async (role = 'customer') => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/stats?role=${role}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch job statistics');
    }

    return data;
  } catch (error) {
    console.error('Error fetching job statistics:', error);
    throw error;
  }
};

// Get available status transitions for a job
export const getJobStatusTransitions = async (jobId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/transitions`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch job status transitions');
    }

    return data;
  } catch (error) {
    console.error('Error fetching job status transitions:', error);
    throw error;
  }
}; 