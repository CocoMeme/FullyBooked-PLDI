const mongoose = require('mongoose');
const User = require('../models/user.model');
const Book = require('../models/book.model');
const Review = require('../models/review.model');
const Order = require('../models/order.model');

// backend/src/reviews/review.controller.js

const submitReview = async (req, res) => {
  try {
    const { rating, comment, email } = req.body;
    const { bookId } = req.params;

    // Check if the book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Create and save the review
    const newReview = await new Review({ bookId, rating, comment, email }).save();

    // Update the book's reviews and average rating
    book.reviews.push(newReview._id);
    const totalRatings = book.reviews.length;
    book.averageRating = ((book.averageRating * (totalRatings - 1)) + rating) / totalRatings;
    await book.save();

    res.status(201).json({ message: "Review submitted successfully", review: newReview });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// Controller function to fetch reviews for a book
const getReviews = async (req, res) => {
  try {
    const { bookId } = req.params;
    const reviews = await Review.find({ bookId }).populate('bookId', 'title category');

    if (!reviews || reviews.length === 0) {
      return res.status(404).json({ message: "No reviews found for this book" });
    }

    res.status(200).json({ reviews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  if (!rating || !comment) {
    return res.status(400).json({ message: 'Rating and comment are required.' });
  }

  try {
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { rating, comment, updatedAt: Date.now() },
      { new: true } // Return the updated document
    );

    if (!updatedReview) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    res.status(200).json({ message: 'Review updated successfully.', review: updatedReview });
  } catch (error) {
    console.error('Error updating review:', error.message);
    res.status(500).json({ message: 'Failed to update review.' });
  }
};

const deleteReview = async (req, res) => {
  const { reviewId } = req.params;

  try {
    const deletedReview = await Review.findByIdAndDelete(reviewId);

    if (!deletedReview) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    res.status(200).json({ message: 'Review deleted successfully.' });
  } catch (error) {
    console.error('Error deleting review:', error.message);
    res.status(500).json({ message: 'Failed to delete review.' });
  }
};

const validateReview = async (req, res) => {
  const { bookId, email } = req.params;

  try {
    // Ensure both bookId and email are provided
    if (!bookId || !email) {
      return res.status(400).json({ canReview: false, message: 'Invalid parameters.' });
    }

    // Find an order with matching email and productIds including bookId
    const userOrder = await Order.findOne({
      email: email,
      productIds: bookId, // Check if productIds includes the bookId
      // status: { $ne: 'Cancelled' }, // Optional: exclude cancelled orders
    });

    if (userOrder) {
      return res.status(200).json({ canReview: true });
    } else {
      return res.status(200).json({ canReview: false });
    }
  } catch (error) {
    console.error('Error validating purchase:', error.message);
    return res.status(500).json({ canReview: false, message: 'Server error.' });
  }
}


exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming you're using middleware to set req.user
    const user = await User.findById(userId).select('_id username email'); // Select necessary fields

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching current user:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  submitReview,
  getReviews,
  updateReview,
  deleteReview,
  validateReview
};



