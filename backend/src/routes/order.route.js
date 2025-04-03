const express = require('express');
const { placeOrder, getAllOrders } = require('../controllers/order.controller');
const verifyTokenandRole = require('../middleware/verifyToken');
const verifyAdminToken = require('../middleware/verifyAdminToken');

const router = express.Router();


router.post('/place',verifyTokenandRole('customer'), placeOrder);
router.get('/all', getAllOrders);

module.exports = router;