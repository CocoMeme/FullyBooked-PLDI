const Book = require('./book.model');
const uploadToCloudinary = require('../../utils/cloudinaryUploader');
const mongoose = require("mongoose"); // Ensure mongoose is imported for ObjectId validation


const postBook = async (req, res) => {
  try {
    const { body } = req;

    console.log("Request Body:", body);

    // Check if coverImage URLs are provided
    if (!body.coverImage || !Array.isArray(body.coverImage) || body.coverImage.length === 0) {
      return res.status(400).send({ message: "At least one image URL is required!" });
    }

    // Create new book with the provided data
    const newBook = new Book({
      ...body,
      coverImage: body.coverImage, // Use URLs directly from the body
    });

    // Save the book to the database
    await newBook.save();

    res.status(200).send({ message: "Book posted successfully!", book: newBook });
  } catch (error) {
    console.error("Error: Creating Book", error);
    res.status(500).send({ message: "Book post failed!", error: error.message });
  }
};


const updateBook = async (req, res) => {
  try {
    console.log("Files received:", req.files); // Debug uploaded files
    console.log("Body received:", req.body); // Debug body data

    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid book ID!" });
    }

    // Fetch the existing book
    const existingBook = await Book.findById(id);
    if (!existingBook) {
      return res.status(404).send({ message: "Book not found!" });
    }

    const { body, files } = req;

    // Replace cover images with new ones only if files are provided
    let updatedImages = [];

    if (files && files.length > 0) {
      // Upload new images and get their URLs
      const uploadedImages = await Promise.all(
        files.map(async (file) => {
          try {
            const result = await uploadToCloudinary(file, "Fully Booked");
            return result;
          } catch (error) {
            console.error("Cloudinary Upload Error:", error);
            return { success: false, error: error.message };
          }
        })
      );

      // Check for failed uploads
      const failedUploads = uploadedImages.filter((img) => !img.success);
      if (failedUploads.length > 0) {
        throw new Error("Some images failed to upload.");
      }

      updatedImages = uploadedImages.map((img) => img.url); // Replace old URLs with new ones
    } else {
      // If no files are uploaded, keep the existing image URLs from the database
      updatedImages = existingBook.coverImage;
    }

    // Update book data
    const updatedData = {
      ...body,
      coverImage: updatedImages, // Ensure only the new images are used
    };

    // Validate price and discount price
    if (updatedData.tag === "Sale" && (!updatedData.discountPrice || updatedData.discountPrice <= 0)) {
      return res.status(400).send({ message: "Discount price is required and must be positive for 'Sale' tag!" });
    }

    // Update the book in the database
    const updatedBook = await Book.findByIdAndUpdate(id, updatedData, { new: true });

    res.status(200).send({
      message: "Book updated successfully!",
      book: updatedBook,
    });
  } catch (error) {
    console.error("Error: Updating Book", error);
    res.status(500).send({ message: "Failed to update the book!", error: error.message });
  }
};


const getAllBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.status(200).send(books);
  } catch (error) {
    console.error("Error: Fetching Books", error);
    res.status(500).send({ message: "Fetch books failed!", error: error.message });
  }
};

const getSingleBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).send({ message: "Book not found!" });
    }
    res.status(200).send(book);
  } catch (error) {
    console.error("Error: Fetching Book", error);
    res.status(500).send({ message: "Fetch book failed!", error: error.message });
  }
};

const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedBook = await Book.findByIdAndDelete(id);
    if (!deletedBook) {
      return res.status(404).send({ message: "Book not found!" });
    }

    res.status(200).send({
      message: "Book deleted successfully!",
      book: deletedBook,
    });
  } catch (error) {
    console.error("Error: Deleting Book", error);
    res.status(500).send({ message: "Delete book failed!", error: error.message });
  }
};

module.exports = {
  postBook,
  getAllBooks,
  getSingleBook,
  updateBook,
  deleteBook,
};
