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
    // If file is already a URL, just return it
    if (typeof file === 'string' && file.startsWith('http')) {
      return { success: true, url: file };
    }

    // Check if file exists
    if (!file || !file.path) {
      throw new Error('No file provided');
    }

    // Upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder: folder,
      resource_type: 'auto',
    });

    // Remove the local file after upload
    if (fs.existsSync(file.path)) {
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