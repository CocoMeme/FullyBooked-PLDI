const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'do8azqoyg',
  api_key: process.env.CLOUDINARY_API_KEY || '893965757911253',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'yxcMlgQUODPGb9YLCmFIxmT_71s',
});

module.exports = cloudinary;