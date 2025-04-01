const Order = require('../models/order.model');
const User = require('../models/user.model');

// Place a new order
exports.placeOrder = async (req, res) => {
  try {
    const { userId, products, paymentMethod } = req.body;

    // Validate request data
    if (!userId || !products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        message: 'Invalid order data. Please provide userId and a non-empty products array.',
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Create a new order
    const order = new Order({
      userId: user._id,
      products,
      paymentMethod,
      status: 'pending', // Default status
    });

    // Save the order to the database
    await order.save();

    res.status(201).json({
      message: 'Order placed successfully.',
      order,
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Failed to place order.' });
  }
};