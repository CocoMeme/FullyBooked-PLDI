const express = require('express');
const { placeOrder, getAllOrders, getMyOrders } = require('../controllers/order.controller');
const verifyTokenandRole = require('../middleware/verifyToken');
const verifyAdminToken = require('../middleware/verifyAdminToken');

const router = express.Router();


router.post('/place',verifyTokenandRole('customer'), placeOrder);
router.get('/all', getAllOrders);
router.get('/my-orders', verifyTokenandRole('customer'), getMyOrders); // Get orders for the logged-in user

module.exports = router;