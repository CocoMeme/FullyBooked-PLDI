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

exports.getMyOrders = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized. User not authenticated.' });
    }

    const { id: userId } = req.user;
    console.log('Fetching orders for user:', userId);

    // Fetch orders for the logged-in user
    const orders = await Order.find({ user: userId })
      .populate('items.book', 'title price')
      .sort({ createdAt: -1 });

    // Add a "toReview" flag for delivered orders that haven't been reviewed
    const formattedOrders = orders.map(order => ({
      ...order.toObject(),
      toReview: order.status === 'delivered' && !order.reviewed, // Add toReview flag
    }));

    res.status(200).json({
      message: 'Orders fetched successfully.',
      orders: formattedOrders,
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Failed to fetch user orders.' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('Request received to update order status:', { id, status });

    if (!status) {
      console.log('Status is missing in the request body');
      return res.status(400).json({ message: 'Status is required' });
    }

    const order = await Order.findById(id);
    if (!order) {
      console.log('Order not found with ID:', id);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('Order found:', order);

    order.status = status;
    await order.save();

    console.log('Order status updated successfully:', order);

    res.status(200).json({ message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
};