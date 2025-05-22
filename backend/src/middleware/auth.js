const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Try to get token from cookie first
    let token = req.cookies.token;
    
    // If no cookie token, try Authorization header (for API clients)
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token with proper error handling
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired, please login again', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ message: 'Invalid token', code: 'INVALID_TOKEN' });
    }

    // Validate decoded token has required fields
    if (!decoded.userId) {
      return res.status(401).json({ message: 'Invalid token format', code: 'INVALID_TOKEN_FORMAT' });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found', code: 'USER_NOT_FOUND' });
    }

    // Set user in request for route handlers
    req.user = user;
    
    // Add the decoded token info to the request
    req.token = decoded;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Server error during authentication' });
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