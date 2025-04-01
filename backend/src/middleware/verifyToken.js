const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'fullybooked-super-secret-jwt-token-key-2025';

const verifyTokenAndRole = (requiredRole) => async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token is required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user's role matches the required role
    if (user.role !== requiredRole) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error in verifyTokenAndRole middleware:', error);
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = verifyTokenAndRole;