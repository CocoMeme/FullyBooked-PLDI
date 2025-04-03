const express = require('express');
const { placeOrder, getAllOrders, getMyOrders, updateOrderStatus, getOrderDetails } = require('../controllers/order.controller');
const { verifyCustomer, verifyAdmin } = require('../middleware/verifyToken');

const router = express.Router();

// Customer routes
router.post('/place', verifyCustomer, placeOrder);
router.get('/my-orders', verifyCustomer, getMyOrders); 
router.get('/:orderId', verifyCustomer, getOrderDetails);

// Admin routes
router.get('/all', verifyAdmin, getAllOrders);
router.put('/update-status/:id', verifyAdmin, updateOrderStatus);

module.exports = router;