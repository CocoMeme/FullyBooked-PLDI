const express = require('express');
const { placeOrder, getAllOrders, getMyOrders, updateOrderStatus, getOrderDetails } = require('../controllers/order.controller');
const { verifyCustomer, verifyAdmin, verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

// Customer routes
router.post('/place', verifyCustomer, placeOrder);
router.get('/my-orders', verifyCustomer, getMyOrders); 
router.get('/my/:orderId', verifyCustomer, getOrderDetails);

// Admin routes
router.get('/all', verifyAdmin, getAllOrders);
router.put('/update-status/:id', verifyAdmin, updateOrderStatus);

// Common route for order details - accessible to both customers and admins
router.get('/:orderId', verifyToken, getOrderDetails);

module.exports = router;