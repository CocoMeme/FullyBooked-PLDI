const express = require('express');
const { placeOrder, getAllOrders, getMyOrders,updateOrderStatus } = require('../controllers/order.controller');
const verifyTokenandRole = require('../middleware/verifyToken');
const verifyAdminToken = require('../middleware/verifyAdminToken');

const router = express.Router();


router.post('/place',verifyTokenandRole('customer'), placeOrder);
router.get('/all', getAllOrders);
router.get('/my-orders', verifyTokenandRole('customer'), getMyOrders); 
router.put('/update-status/:id', verifyAdminToken, updateOrderStatus);
module.exports = router;