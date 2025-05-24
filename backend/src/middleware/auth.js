const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { error: logError, info: logInfo } = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    // Try to get token from cookie first
    let token = req.cookies.token;
    
    // Log cookie and header info in development
    if (process.env.NODE_ENV !== 'production') {
      logInfo(`Cookies: ${JSON.stringify(req.cookies)}`);
      logInfo(`Headers: ${JSON.stringify(req.headers)}`);
    }
    
    // If no cookie token, try Authorization header (for API clients)
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      logError('No token found in request');
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'NO_TOKEN'
      });
    }

    // Verify token with proper error handling
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      logInfo(`Token verified for user: ${decoded.userId}`);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        logError('Token expired');
        return res.status(401).json({ 
          message: 'Token has expired, please login again',
          code: 'TOKEN_EXPIRED'
        });
      }
      logError(`Token verification failed: ${jwtError.message}`);
      return res.status(401).json({ 
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    // Validate decoded token has required fields
    if (!decoded.userId) {
      logError('Token missing userId');
      return res.status(401).json({ 
        message: 'Invalid token format',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      logError(`User not found: ${decoded.userId}`);
      return res.status(401).json({ 
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Set user in request for route handlers
    req.user = user;
    
    // Add the decoded token info to the request
    req.token = decoded;
    
    next();
  } catch (error) {
    logError(`Authentication error: ${error.message}`);
    res.status(500).json({ 
      message: 'Server error during authentication',
      code: 'AUTH_ERROR'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required before authorization', 
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'You do not have permission to access this resource',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  };
};

module.exports = { auth, authorize }; 