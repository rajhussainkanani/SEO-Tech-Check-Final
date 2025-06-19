import axios from 'axios';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 60000, // 60 seconds timeout for SEO analysis
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`Response received from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          throw new Error(data.message || 'Invalid request. Please check your input.');
        case 429:
          throw new Error('Too many requests. Please wait a moment and try again.');
        case 500:
          throw new Error('Server error. Please try again later.');
        case 503:
          throw new Error('Service temporarily unavailable. Please try again later.');
        case 504:
          throw new Error('Request timeout. The website may be slow to respond.');
        default:
          throw new Error(data.message || `Request failed with status ${status}`);
      }
    } else if (error.request) {
      // Network error
      throw new Error('Network error. Please check your internet connection.');
    } else {
      // Other error
      throw new Error(error.message || 'An unexpected error occurred.');
    }
  }
);

/**
 * Analyze a URL for SEO factors
 * @param {string} url - The URL to analyze
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Analysis results
 */
export const analyzeURL = async (url, options = {}) => {
  try {
    const response = await api.post('/seo/analyze', {
      url,
      options: {
        includeImages: true,
        includeLinks: true,
        includePerformance: true,
        timeout: 20000,
        ...options,
      },
    });

    return response.data;
  } catch (error) {
    console.error('SEO analysis failed:', error);
    throw error;
  }
};

/**
 * Validate a URL without performing analysis
 * @param {string} url - The URL to validate
 * @returns {Promise<Object>} Validation result
 */
export const validateURL = async (url) => {
  try {
    const response = await api.post('/seo/validate-url', { url });
    return response.data;
  } catch (error) {
    console.error('URL validation failed:', error);
    throw error;
  }
};

/**
 * Get scraping service status
 * @returns {Promise<Object>} Service status
 */
export const getServiceStatus = async () => {
  try {
    const response = await api.get('/seo/service-status');
    return response.data;
  } catch (error) {
    console.error('Failed to get service status:', error);
    throw error;
  }
};

/**
 * Get general SEO recommendations
 * @returns {Promise<Object>} SEO recommendations
 */
export const getRecommendations = async () => {
  try {
    const response = await api.get('/seo/recommendations');
    return response.data;
  } catch (error) {
    console.error('Failed to get recommendations:', error);
    throw error;
  }
};

/**
 * Check if the backend API is healthy
 * @returns {Promise<boolean>} Health status
 */
export const checkHealth = async () => {
  try {
    const response = await axios.get(
      `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/health`,
      { timeout: 5000 }
    );
    return response.status === 200;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

export default api;
