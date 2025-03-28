const express = require('express');
const {
    createAOrder,
    getOrderByEmail,
    fetchAllOrders,
    updateOrderStatus,
    deleteOrder, // Import delete function
} = require('./order.controller');

const router = express.Router();

router.post("/", createAOrder);
router.get("/email/:email", getOrderByEmail);
router.get("/", fetchAllOrders);
router.put("/:id", updateOrderStatus);
router.delete("/:id", deleteOrder); // Add DELETE route for order deletion

module.exports = router;
