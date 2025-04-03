const mongoose = require('mongoose');
const User = require('../models/user.model');
const Book = require('../models/book.model');
const Review = require('../models/review.model');
const Order = require('../models/order.model');

// backend/src/reviews/review.controller.js

const submitReview = async (req, res) => {
  try {
    console.log('req.user:', req.user); // Debug log to check req.user

    const { rating, comment } = req.body;
    const { bookId } = req.params;
    const userId = req.user._id; // Assuming req.user is set by authentication middleware

    // Check if the book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Create and save the review
    const newReview = await new Review({
      bookId,
      user: userId,
      rating,
      comment,
    }).save();

    // Update the book's reviews and average rating
    book.reviews.push(newReview._id);
    const totalRatings = book.reviews.length;
    book.averageRating = ((book.averageRating * (totalRatings - 1)) + rating) / totalRatings;
    await book.save();

    res.status(201).json({ message: "Review submitted successfully", review: newReview });
  } catch (error) {
    console.error('Error submitting review:', error.message);
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


const getAllReviews = async (req, res) => {
  try {
    // Fetch all reviews and populate the associated book and user details
    const reviews = await Review.find()
      .populate('bookId', 'title category') // Populate book details
      .populate('user', 'name email'); // Populate user details

    if (!reviews || reviews.length === 0) {
      return res.status(404).json({ message: "No reviews found." });
    }

    res.status(200).json({ reviews });
  } catch (error) {
    console.error('Error fetching all reviews:', error.message);
    res.status(500).json({ message: "Failed to fetch reviews." });
  }
};

module.exports = {
  submitReview,
  getReviews,
  getAllReviews,
  updateReview,
  deleteReview,
};



