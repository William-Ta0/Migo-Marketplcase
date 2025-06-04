import axios from "axios";

// Use environment-specific API URLs
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

// Get all categories
export const getCategories = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${API_URL}/categories?${queryString}` : `${API_URL}/categories`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

// Get category by slug
export const getCategoryBySlug = async (slug) => {
  try {
    const response = await axios.get(`${API_URL}/categories/${slug}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching category ${slug}:`, error);
    throw error;
  }
};

// Get subcategories for a category
export const getSubcategories = async (slug) => {
  try {
    const response = await axios.get(`${API_URL}/categories/${slug}/subcategories`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching subcategories for ${slug}:`, error);
    throw error;
  }
};

// Search categories
export const searchCategories = async (query, limit = 20) => {
  try {
    const params = new URLSearchParams({ q: query, limit });
    const response = await axios.get(`${API_URL}/categories/search?${params}`);
    return response.data;
  } catch (error) {
    console.error("Error searching categories:", error);
    throw error;
  }
};

// Get category statistics
export const getCategoryStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/categories/stats`);
    return response.data;
  } catch (error) {
    console.error("Error fetching category stats:", error);
    throw error;
  }
};

// Seed categories (admin function)
export const seedCategories = async () => {
  try {
    const response = await axios.post(`${API_URL}/categories/seed`);
    return response.data;
  } catch (error) {
    console.error("Error seeding categories:", error);
    throw error;
  }
};
