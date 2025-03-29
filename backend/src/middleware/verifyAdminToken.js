const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * Middleware to verify the user has admin role and a valid JWT token
 */
const verifyAdminToken = async (req, res, next) => {
    try {
        // Check for token in Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }
        
        // Extract token from header
        const token = authHeader.split(' ')[1];
        
        // Verify token
        const JWT_SECRET = process.env.JWT_SECRET_KEY || 'fullybooked-super-secret-jwt-token-key-2025';
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if the user exists and is an admin
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }
        
        // Add user data to request for use in controller functions
        req.user = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        };
        
        next();
    } catch (error) {
        console.error('Error in verifyAdminToken middleware:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token.' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired.' });
        }
        
        res.status(500).json({ message: 'Internal server error.' });
    }
};

module.exports = verifyAdminToken;