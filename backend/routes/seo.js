const express = require('express');
const router = express.Router();
const { urlValidationRules, checkValidationResult, validateAnalysisParams } = require('../utils/validators');
const scrapeService = require('../services/scrapeService');
const seoAnalyzer = require('../services/seoAnalyzer');
const logger = require('../utils/logger');

/**
 * @route POST /api/seo/analyze
 * @description Analyze URL for SEO factors
 * @access Public
 */
router.post('/analyze', 
  urlValidationRules(),
  checkValidationResult,
  async (req, res) => {
    const { url } = req.body;
    const options = req.body.options || {};

    try {
      // Validate analysis parameters
      const paramsValidation = validateAnalysisParams(options);
      if (!paramsValidation.isValid) {
        return res.status(400).json({
          error: 'Invalid analysis parameters',
          details: paramsValidation.errors
        });
      }

      // Removed scraping service status check as per user request

      // Log analysis request
      logger.info('Starting SEO analysis', { url, options });

      // Scrape the URL
      const { html, metadata } = await scrapeService.scrapeUrl(url, {
        timeout: options.timeout || 20000,
        waitForSelector: 'body',
        renderJs: true
      });

      // Perform SEO analysis
      const analysisResults = await seoAnalyzer.analyze(html, url, options);

      // Add response metadata
      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        url,
        metadata: {
          ...metadata,
          analysisTime: Date.now() - new Date(analysisResults.timestamp).getTime()
        },
        results: analysisResults
      };

      // Log successful analysis
      logger.seoAnalysis(url, {
        score: analysisResults.score,
        issuesCount: analysisResults.recommendations.length
      });

      return res.status(200).json(response);

    } catch (error) {
      // Log error
      logger.error('SEO analysis failed', {
        url,
        error: error.message,
        stack: error.stack
      });

      // Determine appropriate error response
      let statusCode = 500;
      let errorMessage = 'Internal server error';

      if (error.message.includes('Invalid URL')) {
        statusCode = 400;
        errorMessage = 'Invalid URL provided';
      } else if (error.message.includes('timeout')) {
        statusCode = 504;
        errorMessage = 'Analysis timed out';
      } else if (error.message.includes('rate limit')) {
        statusCode = 429;
        errorMessage = 'Rate limit exceeded';
      }

      return res.status(statusCode).json({
        error: errorMessage,
        message: process.env.NODE_ENV === 'development' ? error.message : errorMessage
      });
    }
  }
);

/**
 * @route GET /api/seo/service-status
 * @description Get scraping service status
 * @access Public
 */
router.get('/service-status', async (req, res) => {
  res.status(501).json({
    error: 'Not implemented',
    message: 'Service status endpoint is not implemented'
  });
});

/**
 * @route POST /api/seo/validate-url
 * @description Validate URL without performing analysis
 * @access Public
 */
router.post('/validate-url',
  urlValidationRules(),
  checkValidationResult,
  (req, res) => {
    res.status(200).json({
      valid: true,
      url: req.body.url
    });
  }
);

/**
 * @route GET /api/seo/recommendations
 * @description Get general SEO recommendations
 * @access Public
 */
router.get('/recommendations', (req, res) => {
  const recommendations = {
    metadata: [
      {
        title: 'Title Tag Optimization',
        description: 'Keep title length between 30-60 characters and include primary keyword',
        importance: 'high'
      },
      {
        title: 'Meta Description',
        description: 'Write compelling meta descriptions between 120-160 characters',
        importance: 'high'
      }
    ],
    content: [
      {
        title: 'Content Length',
        description: 'Aim for at least 300 words of unique, valuable content',
        importance: 'medium'
      },
      {
        title: 'Heading Structure',
        description: 'Use proper H1-H6 hierarchy and include keywords naturally',
        importance: 'high'
      }
    ],
    technical: [
      {
        title: 'Mobile Optimization',
        description: 'Ensure website is fully responsive and mobile-friendly',
        importance: 'high'
      },
      {
        title: 'Page Speed',
        description: 'Optimize images, leverage caching, and minimize code',
        importance: 'high'
      }
    ],
    security: [
      {
        title: 'HTTPS Implementation',
        description: 'Secure website with SSL/TLS certificate',
        importance: 'high'
      }
    ]
  };

  res.status(200).json(recommendations);
});

module.exports = router;
