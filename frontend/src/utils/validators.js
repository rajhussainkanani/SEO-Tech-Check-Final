/**
 * Validates and sanitizes URL input on the frontend
 * @param {string} url - The URL to validate
 * @returns {Object} - Validation result with isValid boolean and sanitized URL
 */
export const validateURL = (url) => {
  const result = {
    isValid: false,
    sanitizedUrl: '',
    errors: []
  };

  if (!url || typeof url !== 'string') {
    result.errors.push('URL is required');
    return result;
  }

  // Remove leading/trailing whitespace
  const trimmedUrl = url.trim();

  if (trimmedUrl.length === 0) {
    result.errors.push('URL cannot be empty');
    return result;
  }

  if (trimmedUrl.length > 2048) {
    result.errors.push('URL is too long (maximum 2048 characters)');
    return result;
  }

  // Add protocol if missing
  let processedUrl = trimmedUrl;
  if (!processedUrl.match(/^https?:\/\//)) {
    processedUrl = 'https://' + processedUrl;
  }

  // Basic URL validation using URL constructor
  try {
    const urlObj = new URL(processedUrl);
    
    // Check protocol
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      result.errors.push('Only HTTP and HTTPS protocols are supported');
      return result;
    }

    // Check hostname
    if (!urlObj.hostname || urlObj.hostname.length === 0) {
      result.errors.push('Invalid hostname');
      return result;
    }

    // Block localhost and private IPs (basic check)
    const hostname = urlObj.hostname.toLowerCase();
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname === '::1' ||
        hostname.match(/^10\./) || 
        hostname.match(/^192\.168\./) || 
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
        hostname.match(/^169\.254\./)) {
      result.errors.push('Local and private IP addresses are not allowed');
      return result;
    }

    // Additional hostname validation
    if (hostname.includes('..') || hostname.startsWith('.') || hostname.endsWith('.')) {
      result.errors.push('Invalid hostname format');
      return result;
    }

    result.isValid = true;
    result.sanitizedUrl = processedUrl;
    
  } catch (error) {
    result.errors.push('Invalid URL format');
  }

  return result;
};

/**
 * Validates email address format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitizes text input to prevent XSS
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
export const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validates form data
 * @param {Object} data - Form data to validate
 * @param {Object} rules - Validation rules
 * @returns {Object} - Validation result
 */
export const validateForm = (data, rules) => {
  const errors = {};
  let isValid = true;

  Object.keys(rules).forEach(field => {
    const value = data[field];
    const fieldRules = rules[field];

    if (fieldRules.required && (!value || value.toString().trim() === '')) {
      errors[field] = `${field} is required`;
      isValid = false;
      return;
    }

    if (value && fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[field] = `${field} must be at least ${fieldRules.minLength} characters`;
      isValid = false;
    }

    if (value && fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[field] = `${field} must be no more than ${fieldRules.maxLength} characters`;
      isValid = false;
    }

    if (value && fieldRules.pattern && !fieldRules.pattern.test(value)) {
      errors[field] = fieldRules.message || `${field} format is invalid`;
      isValid = false;
    }

    if (value && fieldRules.custom && !fieldRules.custom(value)) {
      errors[field] = fieldRules.message || `${field} is invalid`;
      isValid = false;
    }
  });

  return { isValid, errors };
};

/**
 * Debounce function for input validation
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Format URL for display (truncate if too long)
 * @param {string} url - URL to format
 * @param {number} maxLength - Maximum length
 * @returns {string} - Formatted URL
 */
export const formatURL = (url, maxLength = 50) => {
  if (!url || url.length <= maxLength) {
    return url;
  }
  
  return url.substring(0, maxLength - 3) + '...';
};

/**
 * Check if URL is secure (HTTPS)
 * @param {string} url - URL to check
 * @returns {boolean} - Whether URL is secure
 */
export const isSecureURL = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Extract domain from URL
 * @param {string} url - URL to extract domain from
 * @returns {string} - Domain name
 */
export const extractDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
};
