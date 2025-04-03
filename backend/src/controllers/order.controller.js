const Order = require('../models/order.model');
const User = require('../models/user.model');

exports.placeOrder = async (req, res) => {
  try {
    const { id: userId, role } = req.user; // Get userId and role from the verified token
    const { products, paymentMethod } = req.body;

    // Debug log to check the user's role
    console.log('User role in placeOrder:', role);

    // Validate request data
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        message: 'Invalid order data. Please provide a non-empty products array.',
      });
    }

    // Create a new order
    const order = new Order({
      user: userId,
      items: products.map((product) => ({
        book: product.productId,
        quantity: product.quantity,
      })),
      paymentMethod,
      totalAmount: products.reduce((sum, product) => sum + product.price * product.quantity, 0),
      status: 'Pending', // Default status
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

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('items.book', 'title price');
    res.status(200).json({ message: 'Orders fetched successfully.', orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders.' });
  }
};