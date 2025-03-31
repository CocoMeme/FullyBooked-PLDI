const express = require('express');
const { 
  createBook, 
  getAllBooks, 
  getBookById, 
  updateBook, 
  deleteBook 
} = require('../controllers/book.controller');
const verifyAdminToken = require('../middleware/verifyAdminToken');
const { upload } = require('../../utils/multer.config');
const uploadToCloudinary = require('../../utils/cloudinaryUploader');
const router = express.Router();

// Route to create a new book with multiple images
// Accept both 'files' (from mobile) and 'coverImages' (from web) field names
router.post("/create-book", verifyAdminToken, upload.array('files', 5), createBook);

// Route to get all books
router.get("/", getAllBooks);

// Route to get a single book by its ID
router.get("/:id", getBookById);

// Route to update a book with new data and multiple images
// Accept both 'files' (from mobile) and 'coverImages' (from web) field names
router.put("/edit/:id", verifyAdminToken, upload.array('files', 5), updateBook);

// Route to delete a book by its ID
router.delete("/:id", verifyAdminToken, deleteBook);

// Route to upload images and return their Cloudinary URLs
router.post('/upload-cover', upload.array('files', 5), async (req, res) => {
  try {
    console.log('Files received by multer:', req.files);
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    if (!req.files || req.files.length === 0) {
      console.error('No files detected in the request');
      
      // Check if this is a React Native upload with a different format
      if (req.body && Object.keys(req.body).some(key => key.includes('files'))) {
        console.log('Detected potential React Native file format, attempting to parse...');
        
        const files = [];
        // Extract files from the body based on keys that include 'files'
        for (const key in req.body) {
          if (key.includes('files')) {
            try {
              const fileData = JSON.parse(req.body[key]);
              files.push(fileData);
              console.log('Parsed file data:', fileData);
            } catch (e) {
              console.log('Not JSON data in key:', key);
            }
          }
        }
        
        if (files.length > 0) {
          console.log('Processed files from React Native format:', files);
          
          // Cloudinary Upload with extracted file data
          const uploadedImages = await Promise.all(
            files.map((file) => uploadToCloudinary(file, 'Fully Booked'))
          );
          
          console.log('Cloudinary upload results:', uploadedImages);
          
          // Check for failed uploads
          const failedUploads = uploadedImages.filter((img) => !img.success);
          if (failedUploads.length > 0) {
            console.error('Failed uploads:', failedUploads);
            return res.status(500).json({ message: 'Some images failed to upload!' });
          }
          
          return res.status(200).json({
            coverImages: uploadedImages.map((img) => img.url),
          });
        }
      }
      
      return res.status(400).json({ message: 'No file uploaded!' });
    }

    // Standard Cloudinary Upload
    const uploadedImages = await Promise.all(
      req.files.map((file) => uploadToCloudinary(file, 'Fully Booked'))
    );

    console.log('Cloudinary upload results:', uploadedImages);

    // Check for failed uploads
    const failedUploads = uploadedImages.filter((img) => !img.success);
    if (failedUploads.length > 0) {
      console.error('Failed uploads:', failedUploads);
      return res.status(500).json({ message: 'Some images failed to upload!' });
    }

    res.status(200).json({
      coverImages: uploadedImages.map((img) => img.url),
    });
  } catch (error) {
    console.error('Error in /upload-cover route:', error.stack);
    res.status(500).json({ message: 'Image upload failed!', error: error.message });
  }
});

module.exports = router;
