import axios from 'axios';

// Debug: Log API base URL
console.log("API BASE URL:", process.env.REACT_APP_API_BASE_URL);

// Create axios instance with base URL and credentials
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  withCredentials: true, // Important for cookies if needed
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add request interceptor to include auth token and debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.baseURL);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token found and added to request');
    } else {
      console.log('No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling and debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error Details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      console.log('401 Unauthorized - Logging out');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.href = '/login';
    }
    
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - server might be slow');
    }
    
    if (error.message === 'Network Error') {
      console.error('Network Error - check CORS and server status');
    }
    
    return Promise.reject(error);
  }
);

export default api;
