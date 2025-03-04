const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per window
  message: {
    status: 'error',
    message: 'Too many login attempts. Please try again after 15 minutes.'
  }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per minute
  message: {
    status: 'error',
    message: 'Too many requests. Please try again later.'
  }
});

module.exports = { authLimiter, apiLimiter };
