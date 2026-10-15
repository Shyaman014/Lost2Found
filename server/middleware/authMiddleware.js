import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token = req.cookies?.jwt;

  // Support Authorization: Bearer <token> header as fallback
  if (!token && req.headers?.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = await User.findById(decoded.userId).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }
      
      if (!req.user.isActive) {
        return res.status(401).json({ success: false, message: 'Not authorized, account inactive' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

/**
 * Optional authentication middleware:
 * Populates req.user if a valid token is provided, but does not block unauthenticated requests.
 */
export const optionalProtect = async (req, res, next) => {
  let token = req.cookies?.jwt;

  if (!token && req.headers?.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Invalid/expired token — proceed as unauthenticated guest
      req.user = null;
    }
  }

  next();
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role ${req.user ? req.user.role : 'Unknown'} is not authorized to access this route`
      });
    }
    next();
  };
};
