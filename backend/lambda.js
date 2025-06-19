const serverless = require('serverless-http');
const app = require('./server');

// Wrap express app with serverless
module.exports.handler = serverless(app);
