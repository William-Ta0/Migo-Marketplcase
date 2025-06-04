import { auth } from "../firebase/config";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5001/api";

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No authenticated user found");
  }

  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Helper function to get auth headers for file upload
const getFileUploadHeaders = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No authenticated user found");
  }

  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Create a new job/booking
export const createJob = async (jobData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: "POST",
      headers,
      body: JSON.stringify(jobData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create booking");
    }

    return data;
  } catch (error) {
    console.error("Error creating job:", error);
    throw error;
  }
};

// Get jobs for current user
export const getJobs = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();

    // Add parameters
    Object.keys(params).forEach((key) => {
      if (
        params[key] !== undefined &&
        params[key] !== null &&
        params[key] !== ""
      ) {
        queryParams.append(key, params[key]);
      }
    });

    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/jobs?${queryParams}`, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch jobs");
    }

    // Return consistent format
    return {
      success: true,
      data: data.data || data, // Handle both formats
    };
  } catch (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }
};

// Get a specific job by ID
export const getJobById = async (jobId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch job details");
    }

    return data;
  } catch (error) {
    console.error("Error fetching job details:", error);
    throw error;
  }
};

// Update job status
export const updateJobStatus = async (
  jobId,
  status,
  reason = "",
  additionalData = {}
) => {
  try {
    const requestBody = { status, reason, ...additionalData };
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/status`, {
      method: "PUT",
      headers,
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update job status");
    }

    return data;
  } catch (error) {
    console.error("Error updating job status:", error);
    throw error;
  }
};

// Add message to job
export const addJobMessage = async (jobId, message) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to send message");
    }

    return data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// Upload file to job
export const uploadJobFile = async (jobId, file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const headers = await getFileUploadHeaders();
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to upload file");
    }

    return data;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

// Get job statistics
export const getJobStats = async (role = "customer") => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/jobs/stats?role=${role}`, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch job statistics");
    }

    // Return consistent format
    return {
      success: true,
      data: data.data || data, // Handle both formats
    };
  } catch (error) {
    console.error("Error fetching job statistics:", error);
    throw error;
  }
};

// Get available status transitions for a job
export const getJobStatusTransitions = async (jobId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/transitions`, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch job status transitions");
    }

    return data;
  } catch (error) {
    console.error("Error fetching job status transitions:", error);
    throw error;
  }
};

// Get job timeline with detailed history
export const getJobTimeline = async (jobId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/timeline`, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch job timeline");
    }

    return data;
  } catch (error) {
    console.error("Error fetching job timeline:", error);
    throw error;
  }
};
