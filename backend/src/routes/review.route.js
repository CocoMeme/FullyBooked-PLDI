const express = require('express');
const { submitReview, getReviews, updateReview, deleteReview, validateReview} = require('../controllers/review.controller');  // Import the controller functions
const router = express.Router();

router.get('/validate-purchase/:bookId/:email', validateReview);
router.post('/:bookId', submitReview);
router.get('/:bookId', getReviews);
router.put('/:reviewId', updateReview);
router.delete('/:reviewId', deleteReview);

module.exports = router;
