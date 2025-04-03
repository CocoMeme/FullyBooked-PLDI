const express = require('express');
const { placeOrder, getAllOrders } = require('../controllers/order.controller');
const verifyTokenandRole = require('../middleware/verifyToken');
const verifyAdminToken = require('../middleware/verifyAdminToken');

const router = express.Router();


router.post('/place',verifyTokenandRole('customer'), placeOrder);
router.get('/all', getAllOrders);
router.get('/my-orders', getMyOrders); // Get orders for the logged-in user

module.exports = router;