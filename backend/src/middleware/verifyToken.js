const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'fullybooked-super-secret-jwt-token-key-2025';

// Base token verification function
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token is required' });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

// Role-specific middleware functions
const verifyCustomer = async (req, res, next) => {
  try {
    await verifyToken(req, res, () => {
      if (req.user.role.toLowerCase() !== 'customer') {
        return res.status(403).json({ message: 'Access denied. Customer role required.' });
      }
      next();
    });
  } catch (error) {
    next(error);
  }
};

const verifyAdmin = async (req, res, next) => {
  try {
    await verifyToken(req, res, () => {
      if (req.user.role.toLowerCase() !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin role required.' });
      }
      next();
    });
  } catch (error) {
    next(error);
  }
};

// Legacy function for backward compatibility
const verifyTokenAndRole = (requiredRole) => async (req, res, next) => {
  console.warn('WARNING: verifyTokenAndRole is deprecated. Use specific role middleware instead.');
  try {
    await verifyToken(req, res, () => {
      if (req.user.role.toLowerCase() !== requiredRole.toLowerCase()) {
        return res.status(403).json({ message: `Access denied. ${requiredRole} role required.` });
      }
      next();
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyToken,
  verifyCustomer,
  verifyAdmin,
  verifyTokenAndRole
};