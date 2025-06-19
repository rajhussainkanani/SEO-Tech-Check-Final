const winston = require('winston');

// Define custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'seo-tech-check' },
  transports: [
    // Write all logs with level 'error' and below to 'error.log'
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with level 'info' and below to 'combined.log'
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

// If we're not in production, log to the console with a simpler format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ level, message, timestamp, ...metadata }) => {
        let msg = `${timestamp} [${level}] : ${message}`;
        if (Object.keys(metadata).length > 0 && metadata.service !== 'seo-tech-check') {
          msg += JSON.stringify(metadata);
        }
        return msg;
      })
    )
  }));
}

// Create a stream object for Morgan integration
logger.stream = {
  write: function(message) {
    logger.info(message.trim());
  }
};

// Add custom logging methods for SEO-specific events
logger.seoAnalysis = function(url, data) {
  this.info('SEO Analysis completed', {
    url,
    analysisData: data,
    type: 'seo_analysis'
  });
};

logger.scrapeError = function(url, error) {
  this.error('URL scraping failed', {
    url,
    error: error.message,
    type: 'scrape_error'
  });
};

logger.apiError = function(endpoint, error, metadata = {}) {
  this.error('API error occurred', {
    endpoint,
    error: error.message,
    ...metadata,
    type: 'api_error'
  });
};

// Handling uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
});

module.exports = logger;
