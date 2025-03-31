const express = require('express');
const {
    createOrder,
    getUserOrders,
    fetchAllOrders,
    updateOrderStatus,
    getOrderByEmail,
    deleteOrder, // Import delete function
} = require('../controllers/order.controller');

const router = express.Router();

// Create a new order
router.post("/", createOrder);

// Get all orders for a specific user
router.get("/user/:id", getUserOrders);

// Get orders by email
router.get("/email/:email", getOrderByEmail);

// Get all orders (Admin functionality)
router.get("/", fetchAllOrders);

// Update order status
router.put("/:id", updateOrderStatus);

// Delete an order
router.delete("/:id", deleteOrder); // Add DELETE route for order deletion

module.exports = router;