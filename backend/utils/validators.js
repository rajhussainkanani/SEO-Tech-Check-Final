const validator = require('validator');
const { body, validationResult } = require('express-validator');

/**
 * Validates and sanitizes URL input
 * @param {string} url - The URL to validate
 * @returns {Object} - Validation result with isValid boolean and sanitized URL
 */
const validateURL = (url) => {
  const result = {
    isValid: false,
    sanitizedUrl: '',
    errors: []
  };

  if (!url || typeof url !== 'string') {
    result.errors.push('URL is required and must be a string');
    return result;
  }

  // Remove leading/trailing whitespace
  const trimmedUrl = url.trim();

  if (trimmedUrl.length === 0) {
    result.errors.push('URL cannot be empty');
    return result;
  }

  // Add protocol if missing
  let processedUrl = trimmedUrl;
  if (!processedUrl.match(/^https?:\/\//)) {
    processedUrl = 'https://' + processedUrl;
  }

  // Validate URL format
  if (!validator.isURL(processedUrl, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_host: true,
    require_valid_protocol: true,
    allow_underscores: false,
    host_whitelist: false,
    host_blacklist: false,
    allow_trailing_dot: false,
    allow_protocol_relative_urls: false,
    disallow_auth: true
  })) {
    result.errors.push('Invalid URL format');
    return result;
  }

  // Additional security checks
  try {
    const urlObj = new URL(processedUrl);
    
    // Block localhost and private IP ranges for security
    const hostname = urlObj.hostname.toLowerCase();
    
    // Block localhost variations
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      result.errors.push('Localhost URLs are not allowed');
      return result;
    }

    // Block private IP ranges (basic check)
    if (hostname.match(/^10\./) || 
        hostname.match(/^192\.168\./) || 
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
        hostname.match(/^169\.254\./)) {
      result.errors.push('Private IP addresses are not allowed');
      return result;
    }

    // Block file:// and other non-web protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      result.errors.push('Only HTTP and HTTPS protocols are allowed');
      return result;
    }

    result.isValid = true;
    result.sanitizedUrl = processedUrl;
    
  } catch (error) {
    result.errors.push('Invalid URL structure');
  }

  return result;
};

/**
 * Express validator middleware for URL validation
 */
const urlValidationRules = () => {
  return [
    body('url')
      .trim()
      .notEmpty()
      .withMessage('URL is required')
      .isLength({ min: 1, max: 2048 })
      .withMessage('URL must be between 1 and 2048 characters')
      .custom((value) => {
        const validation = validateURL(value);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }
        return true;
      })
  ];
};

/**
 * Middleware to check validation results
 */
const checkValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Sanitizes HTML content to prevent XSS
 * @param {string} html - HTML content to sanitize
 * @returns {string} - Sanitized HTML
 */
const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, '');
};

/**
 * Validates SEO analysis parameters
 * @param {Object} params - Parameters to validate
 * @returns {Object} - Validation result
 */
const validateAnalysisParams = (params) => {
  const result = {
    isValid: true,
    errors: []
  };

  if (params.includeImages !== undefined && typeof params.includeImages !== 'boolean') {
    result.errors.push('includeImages must be a boolean');
    result.isValid = false;
  }

  if (params.includeLinks !== undefined && typeof params.includeLinks !== 'boolean') {
    result.errors.push('includeLinks must be a boolean');
    result.isValid = false;
  }

  if (params.includePerformance !== undefined && typeof params.includePerformance !== 'boolean') {
    result.errors.push('includePerformance must be a boolean');
    result.isValid = false;
  }

  if (params.timeout !== undefined) {
    const timeout = parseInt(params.timeout);
    if (isNaN(timeout) || timeout < 1000 || timeout > 30000) {
      result.errors.push('timeout must be between 1000 and 30000 milliseconds');
      result.isValid = false;
    }
  }

  return result;
};

/**
 * Rate limiting validation for API endpoints
 * @param {string} identifier - Unique identifier (IP, user ID, etc.)
 * @param {number} limit - Request limit
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - Whether request is within limits
 */
const checkRateLimit = (identifier, limit = 10, windowMs = 60000) => {
  // This is a simple in-memory rate limiter
  // In production, use Redis or similar for distributed rate limiting
  if (!global.rateLimitStore) {
    global.rateLimitStore = new Map();
  }

  const now = Date.now();
  const key = `${identifier}_${Math.floor(now / windowMs)}`;
  
  const current = global.rateLimitStore.get(key) || 0;
  
  if (current >= limit) {
    return false;
  }
  
  global.rateLimitStore.set(key, current + 1);
  
  // Clean up old entries
  for (const [storeKey] of global.rateLimitStore) {
    const keyTime = parseInt(storeKey.split('_')[1]);
    if (now - (keyTime * windowMs) > windowMs * 2) {
      global.rateLimitStore.delete(storeKey);
    }
  }
  
  return true;
};

module.exports = {
  validateURL,
  urlValidationRules,
  checkValidationResult,
  sanitizeHtml,
  validateAnalysisParams,
  checkRateLimit
};
