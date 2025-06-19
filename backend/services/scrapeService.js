const axios = require('axios');
const logger = require('../utils/logger');
const querystring = require('querystring');

class ScrapeService {
  constructor() {
    this.apiKey = process.env.SCRAPE_DO_API_KEY || 'ef8324bc40db40949fd2819c8338c2ea0d9573d2940';
    this.baseUrl = 'https://api.scrape.do/';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Scrape a URL with retry mechanism
   * @param {string} url - URL to scrape
   * @param {Object} options - Scraping options
   * @returns {Promise<Object>} Scraped content and metadata
   */
  async scrapeUrl(url, options = {}) {
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 2000;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const encodedUrl = encodeURIComponent(url);
        const fullUrl = `${this.baseUrl}?token=${this.apiKey}&url=${encodedUrl}`;
        const response = await this.client.get(fullUrl);

        if (response.data) {
          logger.info('Successfully scraped URL', {
            url,
            attempt,
            statusCode: response.status
          });

          return {
            html: response.data,
            metadata: {
              statusCode: response.status,
              headers: response.headers,
              timing: response.data.timing || {},
              url: url
            }
          };
        }

        logger.error('Invalid response format from scraping service', {
          url,
          responseData: response.data
        });
        throw new Error('Invalid response format from scraping service');

      } catch (error) {
        lastError = error;
        logger.warn(`Scraping attempt ${attempt} failed:`, {
          url,
          error: error.message,
          status: error.response?.status
        });

        // Check if we should retry based on error type
        if (this.shouldRetry(error) && attempt < maxRetries) {
          await this.delay(retryDelay * attempt);
          continue;
        }

        break;
      }
    }

    // If all retries failed, throw the last error
    logger.error('All scraping attempts failed', {
      url,
      maxRetries,
      lastError: lastError.message
    });

    throw new Error(`Failed to scrape URL after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Check if error is retryable
   * @param {Error} error - The error to check
   * @returns {boolean} Whether to retry
   */
  shouldRetry(error) {
    // Retry on network errors
    if (!error.response) return true;

    // Retry on rate limits
    if (error.response.status === 429) return true;

    // Retry on server errors
    if (error.response.status >= 500) return true;

    // Retry on specific error messages
    const retryMessages = [
      'timeout',
      'econnrefused',
      'econnreset',
      'epipe',
      'rate limit'
    ];

    return retryMessages.some(msg => 
      error.message.toLowerCase().includes(msg)
    );
  }

  /**
   * Delay execution
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new ScrapeService();
