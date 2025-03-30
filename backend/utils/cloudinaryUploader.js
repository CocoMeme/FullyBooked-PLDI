const cloudinary = require('./cloudinaryConfig');
const fs = require('fs');
const path = require('path');

/**
 * Upload an image file to Cloudinary
 * @param {Object} file - The file object from multer
 * @param {String} folder - The folder name in Cloudinary
 * @returns {Object} - Object with success status and URL or error
 */
const uploadToCloudinary = async (file, folder = '') => {
  try {
    console.log('Uploading file to Cloudinary:', file);
    
    // If file is already a URL, just return it
    if (typeof file === 'string' && file.startsWith('http')) {
      return { success: true, url: file };
    }

    // Check if file exists
    if (!file) {
      throw new Error('No file provided');
    }

    // Handle different file object structures
    let filePath;
    if (file.path) {
      // Standard multer file
      filePath = file.path;
    } else if (file.uri) {
      // React Native file format
      filePath = file.uri;
    } else {
      throw new Error('Invalid file format');
    }

    // Upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
    });

    // Remove the local file after upload if it's a server path
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = uploadToCloudinary;