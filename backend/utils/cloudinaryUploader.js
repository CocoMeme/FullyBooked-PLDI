const cloudinary = require('./cloudinaryConfig');
const fs = require('fs');
const path = require('path');

/**
 * Upload an image file to Cloudinary
 * @param {Object|String} file - The file object, URI, or base64 data
 * @param {String} folder - The folder name in Cloudinary
 * @returns {Object} - Object with success status and URL or error
 */
const uploadToCloudinary = async (file, folder = '') => {
  try {
    console.log('Uploading file to Cloudinary:', 
      typeof file === 'string' && file.length > 100 
        ? file.substring(0, 50) + '...' 
        : file);
    
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
    let isBase64 = false;
    let fileData;
    
    if (file.path) {
      // Standard multer file from Express
      filePath = file.path;
      console.log('Using standard multer file path:', filePath);
    } else if (file.uri) {
      // React Native file format with URI
      filePath = file.uri;
      console.log('Using React Native URI:', filePath);
    } else if (typeof file === 'string') {
      if (file.startsWith('data:image')) {
        // Base64 data URI
        console.log('Detected base64 image data, will use for direct upload');
        isBase64 = true;
        fileData = file;
      } else if (file.startsWith('file:///') || file.startsWith('/data/')) {
        // Mobile app file path - we can't access these directly from the backend
        console.log('Detected mobile app file path, but cannot access directly:', file);
        throw new Error('Cannot access mobile file paths directly. Please send image as base64.');
      } else {
        // Direct file path/URI string
        filePath = file;
        console.log('Using direct file path/URI string:', filePath);
      }
    } else {
      console.error('Unrecognized file format:', file);
      throw new Error('Invalid file format');
    }

    // Upload options
    const uploadOptions = {
      folder: folder,
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true
    };
    
    // Handle base64 upload directly to Cloudinary
    if (isBase64) {
      console.log('Uploading base64 data to Cloudinary');
      const result = await cloudinary.uploader.upload(fileData, uploadOptions);
      console.log('Cloudinary upload successful:', result.secure_url);
      
      return {
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height
      };
    } else if (filePath) {
      // Regular file upload
      console.log('Uploading file path to Cloudinary:', filePath);
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
    } else {
      throw new Error('Could not determine upload method');
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = uploadToCloudinary;