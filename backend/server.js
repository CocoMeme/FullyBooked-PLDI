const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const bookRoutes = require('./src/routes/book.route');
const userRoutes = require('./src/routes/user.route');
const orderRoutes = require('./src/routes/order.route');
const reviewRoutes = require('./src/routes/review.route');

// Load environment variables from .env file
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Enable all CORS requests
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8081', 'http://10.0.2.2:8081', 'http://10.0.2.2:3000', 'exp://'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
}));

// Middleware
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://fullybookedipt1:W7lQlq6JFqYcLv2t@cluster0.1uumi.mongodb.net/fullybooked?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch((err) => console.error('Failed to connect to MongoDB:', err));

// Basic route for testing
app.get('/api/ping', (req, res) => {
  console.log('Ping request received');
  res.status(200).json({ message: 'Server is running!' });
});

// API Routes
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);

// Handle 404 errors
app.use((req, res) => {
  console.log(`404 Not Found: ${req.originalUrl}`);
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;