import axios from 'axios';
import { auth } from '../firebase/config';

// Use environment-specific API URLs
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://migo-27d58.web.app/api/items'  // Change this to your actual backend URL when deployed
  : 'http://localhost:5001/api/items';

// Helper to get auth token
const getAuthToken = async () => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    return await currentUser.getIdToken();
  }
  return null;
};

// Get all items
export const getItems = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

// Get item by ID
export const getItemById = async (id) => {
  try {
    const token = await getAuthToken();
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response = await axios.get(`${API_URL}/${id}`, config);
    return response.data;
  } catch (error) {
    console.error(`Error fetching item ${id}:`, error);
    throw error;
  }
};

// Create new item
export const createItem = async (itemData) => {
  try {
    const token = await getAuthToken();
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response = await axios.post(API_URL, itemData, config);
    return response.data;
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
};

// Update item
export const updateItem = async (id, itemData) => {
  try {
    const token = await getAuthToken();
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response = await axios.put(`${API_URL}/${id}`, itemData, config);
    return response.data;
  } catch (error) {
    console.error(`Error updating item ${id}:`, error);
    throw error;
  }
};

// Delete item
export const deleteItem = async (id) => {
  try {
    const token = await getAuthToken();
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response = await axios.delete(`${API_URL}/${id}`, config);
    return response.data;
  } catch (error) {
    console.error(`Error deleting item ${id}:`, error);
    throw error;
  }
}; 