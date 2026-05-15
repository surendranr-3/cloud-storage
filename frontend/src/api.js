/**
 * API CLIENT CONFIGURATION
 * 
 * Axios instance configured for CloudVault API communication.
 * Automatically attaches JWT token to all outgoing requests.
 * Supports both local development and production deployments via environment variables.
 * 
 * Environment Variables:
 * - REACT_APP_API_URL: Backend API endpoint (defaults to http://localhost:5000/api)
 * 
 * Features:
 * - Centralized API configuration for all HTTP requests
 * - Automatic JWT token injection via request interceptor
 * - Request timeout protection (30 seconds)
 * - Error response formatting for consistent error handling
 */

import axios from 'axios';

/**
 * Determine API base URL based on environment
 * Uses REACT_APP_API_URL if set, otherwise defaults to localhost
 */
// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://ec2-13-206-86-158.ap-south-1.compute.amazonaws.com:5000/api';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://stoorage.duckdns.org/api';
// Create axios instance with backend API base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000 // 30 second timeout for all requests
});

/**
 * REQUEST INTERCEPTOR
 * 
 * Automatically adds JWT token to Authorization header on every request.
 * Token is retrieved from localStorage (set during login/registration).
 * 
 * Header format: "Authorization: Bearer <token>"
 * 
 * @param {Object} config - Axios request configuration
 * @returns {Object} Updated config with Authorization header if token exists
 */
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      // Add token to Authorization header for authenticated requests
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    // Handle request setup errors
    return Promise.reject(error);
  }
);

/**
 * RESPONSE INTERCEPTOR
 * 
 * Handles HTTP errors and formats error responses for consistent error handling.
 * If request fails due to expired/invalid token, clears localStorage and redirects to login.
 * 
 * @param {Object} response - Axios response object
 * @returns {Object} Response data if successful
 */
api.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 Unauthorized errors (expired or invalid token)
    if (error.response?.status === 401) {
      // Clear stored token and user data
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      
      // Redirect to login page (only in browser, not during SSR)
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    // Pass error through for component-level handling
    return Promise.reject(error);
  }
);

export default api;