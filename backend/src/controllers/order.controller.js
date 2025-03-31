const Order = require('../models/order.model');
const User = require('../models/user.model');
const { sendPushNotification } = require('../utils/notificationService');

// Create a new order
exports.createOrder = async (req, res) => {
    try {
      const { items, totalAmount } = req.body;
  
      console.log('Received Items:', items); // Debugging items
      console.log('Total Amount:', totalAmount); // Debugging total amount
  
      if (!items || !totalAmount) {
        return res.status(400).json({ message: 'Invalid request data' });
      }
  
      const order = new Order({
        user: req.user.id, // Ensure `req.user` is populated if authentication is used
        items: items.map((item) => ({
          book: item.book,
          quantity: item.quantity,
        })),
        totalAmount,
      });
  
      await order.save();
      res.status(201).json({ message: 'Order created successfully', order });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

// Get all orders for a user
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate('items.book');
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

// Fetch all orders (Admin functionality)
exports.fetchAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Failed to fetch all orders' });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;

    if (status === 'Completed' && !order.notificationSent) {
      // Send push notification
      const user = await User.findById(order.user);
      await sendPushNotification(user.firebaseToken, 'Order Completed', 'Your order has been completed.');
      order.notificationSent = true;
    }

    await order.save();
    res.status(200).json({ message: 'Order updated successfully', order });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Failed to update order' });
  }
};

// Get orders by email
exports.getOrderByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const orders = await Order.find({ email }).sort({ createdAt: -1 });
    if (!orders) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders by email:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

// Delete an order
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the order
    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Failed to delete order' });
  }
};
module.exports = {
    createOrder,
    getUserOrders,
    fetchAllOrders,
    updateOrderStatus,
    getOrderByEmail,
    deleteOrder, // Added delete function
};
