const express = require('express');
const { submitReview, getReviews, getAllReviews, updateReview, deleteReview} = require('../controllers/review.controller');  // Import the controller functions
const verifyTokenAndRole = require('../middleware/verifyToken');
const router = express.Router();

router.post('/:bookId',verifyTokenAndRole('customer'), submitReview);
router.get('/:bookId', getReviews);
router.get('/',getAllReviews);
router.put('/:reviewId', updateReview);
router.delete('/:reviewId', deleteReview);

module.exports = router;
