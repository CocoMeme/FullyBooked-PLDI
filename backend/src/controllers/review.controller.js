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
    const orderId = req.body.orderId || null; // Get orderId from request if provided
    
    if (!req.user || !req.user._id) {
      console.error('Authentication error: User not properly authenticated');
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const userId = req.user._id;

    // Check if the book exists
    console.log('Received book from params:', bookId); // Debug log to check bookId
    const book = await Book.findById(bookId);
    if (!book) {
      console.error(`Book not found with ID: ${bookId}`);
      return res.status(404).json({ message: "Book not found" });
    }

    // Check if user has already reviewed this book
    const existingReview = await Review.findOne({ user: userId, bookId });
    
    if (existingReview) {
      // Update the existing review instead of creating a new one
      existingReview.rating = rating;
      existingReview.comment = comment;
      existingReview.updatedAt = Date.now();
      if (orderId && !existingReview.order) {
        existingReview.order = orderId;
      }
      
      await existingReview.save();
      
      // Update the book's average rating
      const allReviews = await Review.find({ bookId });
      const totalRatings = allReviews.length;
      const sumRatings = allReviews.reduce((sum, review) => sum + review.rating, 0);
      book.averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;
      await book.save();
      
      // Update the order item to mark it as reviewed if orderId is provided
      if (orderId) {
        try {
          await Order.updateOne(
            { _id: orderId, "items.book": bookId },
            { $set: { "items.$.isReviewed": true } }
          );
        } catch (orderError) {
          console.error('Error updating order review status:', orderError);
          // Continue even if order update fails
        }
      }
      
      return res.status(200).json({ 
        message: "Review updated successfully", 
        review: existingReview,
        updated: true
      });
    }

    // Create a new review if one doesn't exist
    const newReview = new Review({
      bookId,
      user: userId,
      rating,
      comment,
      order: orderId
    });
    
    await newReview.save();

    // Update the book's reviews and average rating
    book.reviews.push(newReview._id);
    
    // Recalculate the average rating
    const allReviews = await Review.find({ bookId });
    const totalRatings = allReviews.length;
    const sumRatings = allReviews.reduce((sum, review) => sum + review.rating, 0);
    book.averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;
    
    await book.save();
    
    // Update the order item to mark it as reviewed if orderId is provided
    if (orderId) {
      try {
        await Order.updateOne(
          { _id: orderId, "items.book": bookId },
          { $set: { "items.$.isReviewed": true } }
        );
      } catch (orderError) {
        console.error('Error updating order review status:', orderError);
        // Continue even if order update fails
      }
    }

    res.status(201).json({ message: "Review submitted successfully", review: newReview });
  } catch (error) {
    console.error('Error submitting review:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Controller function to fetch reviews for a book
const getReviews = async (req, res) => {
  try {
    const { bookId } = req.params;
    const reviews = await Review.find({ bookId })
      .populate('bookId', 'title category')
      .populate('user', 'username email');

    // Return empty array instead of 404 when no reviews found
    res.status(200).json({ reviews: reviews || [] });
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

    // Recalculate the book's average rating
    const allReviews = await Review.find({ bookId: updatedReview.bookId });
    const totalRatings = allReviews.length;
    const sumRatings = allReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

    // Update the book's average rating
    await Book.findByIdAndUpdate(updatedReview.bookId, { averageRating });

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
      .populate('bookId', 'title category')
      .populate('user', 'username email') // Changed name to username to match User model
      .sort({ createdAt: -1 }); // Sort by newest first

    if (!reviews || reviews.length === 0) {
      return res.status(404).json({ message: "No reviews found." });
    }

    res.status(200).json({ reviews });
  } catch (error) {
    console.error('Error fetching all reviews:', error.message);
    res.status(500).json({ message: "Failed to fetch reviews." });
  }
};

const getUserBookReview = async (req, res) => {
  try {
    const { userId, bookId } = req.params;
    console.log(`Fetching review for book ${bookId} by user ${userId}`);

    // Validate parameters
    if (!userId || !bookId) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID and Book ID are required.'
      });
    }

    // Find the review that matches both the user and book
    const review = await Review.findOne({
      user: userId,
      bookId: bookId
    }).populate('user', 'username email'); // Use username instead of name to match your model

    if (!review) {
      // Return 200 with success: false instead of 404 for missing reviews
      // This prevents console errors in the frontend for expected "no review" cases
      return res.status(200).json({ 
        success: false,
        message: 'No review found for this book by this user',
        exists: false
      });
    }

    // Return the review with success status
    res.status(200).json({
      success: true,
      message: 'Review fetched successfully',
      review,
      exists: true
    });
  } catch (error) {
    console.error('Error fetching user book review:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch review' 
    });
  }
};

module.exports = {
  submitReview,
  getReviews,
  getAllReviews,
  updateReview,
  deleteReview,
  getUserBookReview
};



