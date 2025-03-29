const Order = require("../models/order.model");

// Create a new order
const createAOrder = async (req, res) => {
    try {
        const newOrder = await Order(req.body);
        const savedOrder = await newOrder.save();
        res.status(200).json(savedOrder);
    } catch (error) {
        console.error("Error: Creating Order");
        res.status(500).json({ message: "Failed creating order" });
    }
};

// Get orders by email
const getOrderByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const orders = await Order.find({ email }).sort({ createdAt: -1 });
        if (!orders) {
            return res.status(500).json({ message: "Order not found" });
        }
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error: Fetching Order");
        res.status(500).json({ message: "Failed fetching orders" });
    }
};

// Fetch all orders
const fetchAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error: Fetching all orders");
        res.status(500).json({ message: "Failed fetching all orders" });
    }
};

// Update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params; // Order ID
        const { status } = req.body; // New status

        // Validate status
        const validStatuses = ['Pending', 'Processing', 'Shipping', 'Delivered'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        // Find and update the order
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true } // Return the updated document
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error("Error: Updating order status", error);
        res.status(500).json({ message: "Failed updating order status" });
    }
};

// Delete an order
const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        // Find and delete the order
        const deletedOrder = await Order.findByIdAndDelete(id);

        if (!deletedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
        console.error("Error: Deleting order", error);
        res.status(500).json({ message: "Failed deleting order" });
    }
};

module.exports = {
    createAOrder,
    getOrderByEmail,
    fetchAllOrders,
    updateOrderStatus,
    deleteOrder, // Added delete function
};
