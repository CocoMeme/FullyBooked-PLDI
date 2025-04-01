const express = require('express');
const { placeOrder } = require('../controllers/order.controller');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// Place a new order
router.post('/place',verifyToken, placeOrder);

module.exports = router;