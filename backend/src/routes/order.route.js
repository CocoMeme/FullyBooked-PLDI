const express = require('express');
const { placeOrder, getAllOrders, getMyOrders, updateOrderStatus, getOrderDetails } = require('../controllers/order.controller');
const { verifyCustomer, verifyAdmin } = require('../middleware/verifyToken');

const router = express.Router();

router.post('/place', verifyCustomer, placeOrder);
router.get('/all', verifyAdmin, getAllOrders);
router.get('/my-orders', verifyCustomer, getMyOrders); 
router.put('/update-status/:id', verifyAdmin, updateOrderStatus);

router.get('/:orderId', verifyCustomer, getOrderDetails);

module.exports = router;