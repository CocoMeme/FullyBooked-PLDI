const express = require('express');
const { submitReview, getReviews, getAllReviews, updateReview, deleteReview, getUserBookReview } = require('../controllers/review.controller');
const { verifyCustomer, verifyAdmin, verifyToken } = require('../middleware/verifyToken');
const router = express.Router();

router.post('/:bookId', verifyCustomer, submitReview);
router.get('/user/:userId/book/:bookId', verifyToken, getUserBookReview); // New endpoint
router.get('/:bookId', getReviews);
router.get('/', getAllReviews);
router.put('/:reviewId', verifyCustomer, updateReview);
router.delete('/:reviewId', verifyAdmin, deleteReview);

module.exports = router;
