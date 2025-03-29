const express = require('express');
const { 
  postBook, 
  getAllBooks, 
  getSingleBook, 
  updateBook, 
  deleteBook 
} = require('../controllers/book.controller');
const verifyAdminToken = require('../middleware/verifyAdminToken');
const { upload } = require('../../utils/multer.config');
const uploadToCloudinary = require('../../utils/cloudinaryUploader'); // Ensure this is imported
const router = express.Router();

// Route to create a new book with multiple images
router.post("/create-book", verifyAdminToken, upload.array('coverImages', 5), postBook); // Limit to 5 files

// Route to get all books
router.get("/", getAllBooks);

// Route to get a single book by its ID
router.get("/:id", getSingleBook);

// Route to update a book with new data and multiple images
router.put("/edit/:id", verifyAdminToken, upload.array('coverImages', 5), updateBook); // Limit to 5 files

// Route to delete a book by its ID
router.delete("/:id", verifyAdminToken, deleteBook);

// Route to upload images and return their Cloudinary URLs
// router.post("/upload-cover", upload.array('coverImages', 5), async (req, res) => {
//     try {
//       if (!req.files || req.files.length === 0) {
//         return res.status(400).json({ message: "No file uploaded!" });
//       }
  
//       const uploadedImages = await Promise.all(
//         req.files.map((file) => uploadToCloudinary(file, 'Fully Booked'))
//       );
  
//       // Check for failed uploads
//       const failedUploads = uploadedImages.filter((img) => !img.success);
//       if (failedUploads.length > 0) {
//         throw new Error("Some images failed to upload.");
//       }
  
//       res.status(200).json({
//         coverImages: uploadedImages.map((img) => img.url), // Extract Cloudinary URLs
//       });
//     } catch (error) {
//       console.error("Error uploading cover image(s):", error);
//       res.status(500).json({ message: "Image upload failed!", error: error.message });
//     }
//   });

router.post('/upload-cover', upload.array('coverImages', 5), async (req, res) => {
  try {
    console.log('Files received by multer:', req.files); // Debug files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No file uploaded!' });
    }

    // Cloudinary Upload
    const uploadedImages = await Promise.all(
      req.files.map((file) => uploadToCloudinary(file, 'Fully Booked'))
    );

    console.log('Cloudinary upload results:', uploadedImages); // Debug Cloudinary results

    // Check for failed uploads
    const failedUploads = uploadedImages.filter((img) => !img.success);
    if (failedUploads.length > 0) {
      console.error('Failed uploads:', failedUploads); // Debug failed uploads
      return res.status(500).json({ message: 'Some images failed to upload!' });
    }

    res.status(200).json({
      coverImages: uploadedImages.map((img) => img.url),
    });
  } catch (error) {
    console.error('Error in /upload-cover route:', error.stack); // Debug error stack
    res.status(500).json({ message: 'Image upload failed!', error: error.message });
  }
});


  

module.exports = router;
