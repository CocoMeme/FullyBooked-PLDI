const express = require('express');
const { placeOrder } = require('../controllers/order.controller');
const verifyTokenandRole = require('../middleware/verifyToken');

const router = express.Router();

// Place a new order
router.post('/place',verifyTokenandRole('customer'), placeOrder);

module.exports = router;