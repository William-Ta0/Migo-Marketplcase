import axios from "axios";
import { auth } from "../firebase/config";

// Use environment-specific API URLs
const API_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/services`
  : "http://localhost:5555/api/services";

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No authenticated user found");
  }

  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

// Get all services with filtering
export const getServices = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${API_URL}?${queryString}` : API_URL;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching services:", error);
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
    console.error("Error searching services:", error);
    throw error;
  }
};

// Get services by category
export const getServicesByCategory = async (slug, params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString
      ? `${API_URL}/category/${slug}?${queryString}`
      : `${API_URL}/category/${slug}`;
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
    const url = queryString
      ? `${API_URL}/featured?${queryString}`
      : `${API_URL}/featured`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching featured services:", error);
    throw error;
  }
};

// Get service statistics
export const getServiceStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/stats`);
    return response.data;
  } catch (error) {
    console.error("Error fetching service stats:", error);
    throw error;
  }
};

// Create a new service
export const createService = async (serviceData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(API_URL, serviceData, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating service:", error);
    throw error;
  }
};

// Update a service
export const updateService = async (id, serviceData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.put(`${API_URL}/${id}`, serviceData, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating service ${id}:`, error);
    throw error;
  }
};

// Delete a service
export const deleteService = async (id) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting service ${id}:`, error);
    throw error;
  }
};

// Get vendor's services
export const getVendorServices = async (vendorId) => {
  try {
    const response = await axios.get(`${API_URL}/vendor/${vendorId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching vendor services ${vendorId}:`, error);
    throw error;
  }
};
