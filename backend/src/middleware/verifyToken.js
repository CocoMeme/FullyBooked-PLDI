const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'fullybooked-super-secret-jwt-token-key-2025';

const verifyToken = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      console.log('Authorization header:', authHeader); 

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No token provided or invalid format');
        return res.status(401).json({ message: 'Authorization token is required' });
      }
  
      const token = authHeader.split(' ')[1];
      console.log('Token extracted:', token); // Debug log to check the token

      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Decoded token:', decoded); // Debug log to check the decoded token

      const user = await User.findById(decoded.id);
      if (!user) {
        console.log('User not found for token:',decoded.id);
        return res.status(404).json({ message: 'User not found' });
      }
  
      req.user = user;
      next();
    } catch (error) {
      console.error('Error in verifyToken middleware:', error);
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
  };
  
module.exports = verifyToken;