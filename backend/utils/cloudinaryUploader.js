const cloudinary = require('./cloudinaryConfig');
const fs = require('fs');
const path = require('path');

/**
 * Upload an image file to Cloudinary
 * @param {Object} file - The file object from multer or React Native
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
      // Standard multer file from Express
      filePath = file.path;
      console.log('Using standard multer file path:', filePath);
    } else if (file.uri) {
      // React Native file format with URI
      filePath = file.uri;
      console.log('Using React Native URI:', filePath);
    } else if (typeof file === 'string' && (file.startsWith('file:///') || file.startsWith('/'))) {
      // Direct file path/URI string
      filePath = file;
      console.log('Using direct file path/URI string:', filePath);
    } else {
      console.error('Unrecognized file format:', file);
      throw new Error('Invalid file format');
    }

    console.log('Uploading to Cloudinary with path:', filePath);
    
    // Upload options
    const uploadOptions = {
      folder: folder,
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true
    };
    
    // Upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    console.log('Cloudinary upload successful:', result.secure_url);

    // Remove the local file after upload if it's a server path and exists
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
      console.log('Removed local file after upload:', file.path);
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