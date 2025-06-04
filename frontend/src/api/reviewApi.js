import axios from 'axios';
import { auth } from '../firebase/config';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5555/api';

// Create a specific axios instance for review API
const reviewAxios = axios.create({
  baseURL: API_URL,
});

// Set up axios interceptor to get fresh Firebase token for each request
reviewAxios.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Get fresh token on each request
        const idToken = await user.getIdToken(true);
        config.headers.Authorization = `Bearer ${idToken}`;
        console.log('Fresh Firebase token obtained for request');
      } else {
        console.warn('No authenticated user found');
      }
    } catch (error) {
      console.error('Error getting Firebase token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const reviewApi = {
  // Submit a new review
  createReview: async (reviewData) => {
    try {
      console.log('Submitting review with token:', localStorage.getItem('token') ? 'Token exists' : 'No token');
      const response = await reviewAxios.post('/reviews', reviewData);
      return response.data;
    } catch (error) {
      console.error('Review submission error:', error.response?.data);
      throw error.response?.data || { message: 'Failed to submit review' };
    }
  },

  // Get reviews for a vendor
  getVendorReviews: async (vendorId, params = {}) => {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 10,
        sort: params.sort || 'newest'
      });
      
      const response = await reviewAxios.get(`/reviews/vendor/${vendorId}?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch vendor reviews' };
    }
  },

  // Get reviews for a service
  getServiceReviews: async (serviceId, params = {}) => {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 10
      });
      
      const response = await reviewAxios.get(`/reviews/service/${serviceId}?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch service reviews' };
    }
  },

  // Get review for a specific job
  getJobReview: async (jobId) => {
    try {
      console.log('Fetching job review with token:', localStorage.getItem('token') ? 'Token exists' : 'No token');
      const response = await reviewAxios.get(`/reviews/job/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Job review fetch error:', error.response?.data);
      throw error.response?.data || { message: 'Failed to fetch job review' };
    }
  },

  // Update a review
  updateReview: async (reviewId, updateData) => {
    try {
      const response = await reviewAxios.put(`/reviews/${reviewId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update review' };
    }
  },

  // Delete a review
  deleteReview: async (reviewId) => {
    try {
      const response = await reviewAxios.delete(`/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete review' };
    }
  },

  // Mark review as helpful
  markReviewHelpful: async (reviewId) => {
    try {
      const response = await reviewAxios.post(`/reviews/${reviewId}/helpful`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to mark review as helpful' };
    }
  },

  // Add vendor response to review
  addVendorResponse: async (reviewId, responseData) => {
    try {
      const response = await reviewAxios.post(`/reviews/${reviewId}/response`, responseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add vendor response' };
    }
  },

  // Get vendor review statistics
  getVendorReviewStats: async (vendorId) => {
    try {
      const response = await reviewAxios.get(`/reviews/vendor/${vendorId}/stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch review statistics' };
    }
  }
}; 