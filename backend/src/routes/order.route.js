const express = require('express');
const { placeOrder } = require('../controllers/order.controller');

const router = express.Router();

// Place a new order
router.post('/place', placeOrder);

module.exports = router;