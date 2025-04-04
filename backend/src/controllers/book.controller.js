const Book = require('../models/book.model');
const uploadToCloudinary = require('../../utils/cloudinaryUploader');
const mongoose = require("mongoose");

// Create a new book
const createBook = async (req, res) => {
  try {
    const { body, files } = req;
    console.log("Request Body:", body);
    console.log("Files received:", files);

    // Upload images to Cloudinary if files are provided
    let imageUrls = [];
    if (files && files.length > 0) {
      console.log(`Starting upload of ${files.length} files to Cloudinary`);
      
      const uploadPromises = files.map(file => uploadToCloudinary(file, "Fully Booked"));
      const uploadResults = await Promise.all(uploadPromises);
      
      console.log("Upload results:", uploadResults);
      
      // Extract URLs from successful uploads
      imageUrls = uploadResults
        .filter(result => result.success)
        .map(result => result.url);
      
      console.log("Extracted image URLs:", imageUrls);
      
      if (imageUrls.length === 0) {
        return res.status(400).send({ message: "Failed to upload images!" });
      }
    } else if (body.coverImage && Array.isArray(body.coverImage) && body.coverImage.length > 0) {
      // If no files but URLs are provided in body
      console.log("Using provided coverImage URLs from body");
      imageUrls = body.coverImage;
    } else {
      console.error("No images were provided in the request");
      return res.status(400).send({ message: "At least one image is required!" });
    }

    // Create new book with the provided data
    const bookData = {
      ...body,
      coverImage: imageUrls,
      stock: body.stock !== undefined ? parseInt(body.stock) : 0, // Ensure stock is properly set
    };
    
    console.log("Creating book with data:", bookData);
    const newBook = new Book(bookData);

    // Save the book to the database
    await newBook.save();
    console.log("Book saved successfully with ID:", newBook._id);

    res.status(201).send({ 
      success: true,
      message: "Book created successfully!", 
      book: newBook 
    });
  } catch (error) {
    console.error("Error creating book:", error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).send({
        success: false,
        message: "Validation failed!",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).send({ 
      success: false,
      message: "Book creation failed!", 
      error: error.message 
    });
  }
};

// Update an existing book
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { body, files } = req;

    console.log("Update Body:", body);
    console.log("Update Files:", files);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ 
        success: false,
        message: "Invalid book ID!" 
      });
    }

    // Fetch the existing book
    const existingBook = await Book.findById(id);
    if (!existingBook) {
      return res.status(404).send({ 
        success: false,
        message: "Book not found!" 
      });
    }

    // Handle images: upload new ones or keep existing ones
    let updatedImages = existingBook.coverImage; // Default to existing images

    if (files && files.length > 0) {
      // Upload new images to Cloudinary
      const uploadPromises = files.map(file => uploadToCloudinary(file, "Fully Booked"));
      const uploadResults = await Promise.all(uploadPromises);
      
      // Extract URLs from successful uploads
      const newImageUrls = uploadResults
        .filter(result => result.success)
        .map(result => result.url);
      
      if (newImageUrls.length > 0) {
        updatedImages = newImageUrls; // Replace with new images
      }
    } else if (body.coverImage && Array.isArray(body.coverImage) && body.coverImage.length > 0) {
      // If URLs are directly provided in the body
      updatedImages = body.coverImage;
    }

    // Prepare update data with explicit stock handling
    const updateData = {
      ...body,
      coverImage: updatedImages,
      // Ensure stock is properly set, keep existing stock if not provided in request
      stock: body.stock !== undefined ? parseInt(body.stock) : existingBook.stock,
    };

    // Validate price and discount price if tag is 'Sale'
    if (updateData.tag === 'Sale' && (!updateData.discountPrice || updateData.discountPrice <= 0)) {
      return res.status(400).send({ 
        success: false,
        message: "Discount price is required and must be positive when tag is 'Sale'!" 
      });
    }

    // Update the book in the database
    const updatedBook = await Book.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    res.status(200).send({
      success: true,
      message: "Book updated successfully!",
      book: updatedBook,
    });
  } catch (error) {
    console.error("Error: Updating Book", error);
    res.status(500).send({ 
      success: false,
      message: "Failed to update the book!", 
      error: error.message 
    });
  }
};

// Get all books
const getAllBooks = async (req, res) => {
  try {
    const { category, tag, priceMin, priceMax, search } = req.query;
    
    // Build query filters
    let filter = {};
    
    // Apply category filter if provided
    if (category) {
      filter.category = category;
    }
    
    // Apply tag filter if provided
    if (tag) {
      filter.tag = tag;
    }
    
    // Apply price range filter if provided
    if (priceMin !== undefined || priceMax !== undefined) {
      filter.price = {};
      if (priceMin !== undefined) filter.price.$gte = Number(priceMin);
      if (priceMax !== undefined) filter.price.$lte = Number(priceMax);
    }
    
    // Apply search filter if provided
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query with filters and sort by most recent
    const books = await Book.find(filter).sort({ createdAt: -1 });
    
    res.status(200).send({
      success: true,
      count: books.length,
      books: books
    });
  } catch (error) {
    console.error("Error: Fetching Books", error);
    res.status(500).send({ 
      success: false,
      message: "Failed to fetch books!", 
      error: error.message 
    });
  }
};

// Get a single book by ID
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ 
        success: false,
        message: "Invalid book ID!" 
      });
    }
    
    // Find book and populate reviews if needed
    const book = await Book.findById(id).populate('reviews');
    
    if (!book) {
      return res.status(404).send({ 
        success: false,
        message: "Book not found!" 
      });
    }
    
    res.status(200).send({
      success: true,
      book: book
    });
  } catch (error) {
    console.error("Error: Fetching Book", error);
    res.status(500).send({ 
      success: false,
      message: "Failed to fetch book!", 
      error: error.message 
    });
  }
};

// Search books with advanced filtering
const searchBooks = async (req, res) => {
  try {
    const { query, category, author, price, sort = 'relevance' } = req.query;
    
    // Build search filters
    let filter = {};
    
    // Main search query - search by title, author, category, description
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { author: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { isbn: { $regex: query, $options: 'i' } }
      ];
    }
    
    // Apply additional filters if provided
    if (category) {
      filter.category = category;
    }
    
    if (author) {
      filter.author = { $regex: author, $options: 'i' };
    }
    
    if (price) {
      const [min, max] = price.split('-').map(Number);
      filter.price = {};
      if (min) filter.price.$gte = min;
      if (max) filter.price.$lte = max;
    }
    
    // Determine sort order
    let sortOptions = {};
    switch (sort) {
      case 'price_asc':
        sortOptions = { price: 1 };
        break;
      case 'price_desc':
        sortOptions = { price: -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'relevance':
      default:
        // For relevance sorting, we'll stick with default MongoDB scoring
        if (query) {
          // If there's a search query, sort by text score
          sortOptions = { score: { $meta: "textScore" } };
        } else {
          // Otherwise, sort by newest
          sortOptions = { createdAt: -1 };
        }
    }

    // Execute search query
    let books;
    if (query && sortOptions.score) {
      // If using text score for sorting
      books = await Book.find(filter)
                       .select({ score: { $meta: "textScore" } })
                       .sort(sortOptions);
    } else {
      // Normal sorting
      books = await Book.find(filter).sort(sortOptions);
    }
    
    res.status(200).send({
      success: true,
      count: books.length,
      books: books,
      filters: {
        query,
        category,
        author,
        price,
        sort
      }
    });
  } catch (error) {
    console.error("Error: Searching Books", error);
    res.status(500).send({ 
      success: false,
      message: "Failed to search books!", 
      error: error.message 
    });
  }
};

// Delete a book
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ 
        success: false,
        message: "Invalid book ID!" 
      });
    }

    const deletedBook = await Book.findByIdAndDelete(id);
    
    if (!deletedBook) {
      return res.status(404).send({ 
        success: false,
        message: "Book not found!" 
      });
    }

    // Note: In a production app, you might want to delete associated images from Cloudinary here

    res.status(200).send({
      success: true,
      message: "Book deleted successfully!",
      book: deletedBook,
    });
  } catch (error) {
    console.error("Error: Deleting Book", error);
    res.status(500).send({ 
      success: false,
      message: "Failed to delete book!", 
      error: error.message 
    });
  }
};

module.exports = {
  createBook,
  updateBook,
  getAllBooks,
  getBookById,
  searchBooks,
  deleteBook,
};
