const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'fullybooked-super-secret-jwt-token-key-2025';

// Middleware that verifies token and checks role
const verifyTokenAndRole = (requiredRole) => async (req, res, next) => {
  try {
    console.log('Verifying token for required role:', requiredRole);
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Authorization header missing or invalid:', authHeader);
      return res.status(401).json({ message: 'Authorization token is required' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token received:', token.substring(0, 10) + '...');
    
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded token:', decoded);

    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('User not found with id:', decoded.id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User found:', {
      id: user._id,
      role: user.role,
      requiredRole: requiredRole
    });

    // Case-insensitive role check
    if (user.role.toLowerCase() !== requiredRole.toLowerCase()) {
      console.log('Role mismatch:', {
        userRole: user.role,
        requiredRole: requiredRole
      });
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    req.user = user;
    console.log('Authentication successful, proceeding to route handler');
    next();
  } catch (error) {
    console.error('Error in verifyTokenAndRole middleware:', error);
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

// Simple middleware that only verifies token without checking role
const verifyToken = async (req, res, next) => {
  try {
    console.log('Verifying token without role check');
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Authorization header missing or invalid:', authHeader);
      return res.status(401).json({ message: 'Authorization token is required' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token received:', token.substring(0, 10) + '...');
    
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded token:', decoded);

    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('User not found with id:', decoded.id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User found:', {
      id: user._id,
      role: user.role
    });

    req.user = user;
    console.log('Authentication successful, proceeding to route handler');
    next();
  } catch (error) {
    console.error('Error in verifyToken middleware:', error);
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = verifyTokenAndRole;
module.exports.verifyToken = verifyToken;