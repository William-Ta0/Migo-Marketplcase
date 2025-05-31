import axios from 'axios';

// Use environment-specific API URLs
const API_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL || 'https://your-backend-url.com/api/services'
  : 'http://localhost:5001/api/services';

// Get all services with filtering
export const getServices = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${API_URL}?${queryString}` : API_URL;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
};

// Get service by ID
export const getServiceById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching service ${id}:`, error);
    throw error;
  }
};

// Search services
export const searchServices = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await axios.get(`${API_URL}/search?${queryString}`);
    return response.data;
  } catch (error) {
    console.error('Error searching services:', error);
    throw error;
  }
};

// Get services by category
export const getServicesByCategory = async (slug, params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${API_URL}/category/${slug}?${queryString}` : `${API_URL}/category/${slug}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching services for category ${slug}:`, error);
    throw error;
  }
};

// Get featured services
export const getFeaturedServices = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${API_URL}/featured?${queryString}` : `${API_URL}/featured`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching featured services:', error);
    throw error;
  }
};

// Get service statistics
export const getServiceStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching service stats:', error);
    throw error;
  }
}; 