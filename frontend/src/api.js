/**
 * API CLIENT CONFIGURATION
 * 
 * Axios instance configured for CloudVault API communication.
 * Automatically attaches JWT token to all outgoing requests.
 * 
 * Base URL: Backend API endpoint (configured for production server)
 * 
 * Features:
 * - Centralized API configuration
 * - Automatic JWT token injection via request interceptor
 * - Error handling can be added via response interceptors
 */

import axios from 'axios';

// Create axios instance with backend API base URL
const api = axios.create({
  baseURL: 'http://65.0.89.9:5000/api' // Backend API endpoint
});

/**
 * Request Interceptor
 * 
 * Automatically adds JWT token to Authorization header on every request.
 * Token retrieved from localStorage (set after login/register).
 * 
 * Header format: "Authorization: Bearer <token>"
 */
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    // Add token to Authorization header for authenticated requests
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;