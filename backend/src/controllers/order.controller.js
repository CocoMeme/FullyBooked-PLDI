const Order = require('../models/order.model');
const User = require('../models/user.model');

exports.placeOrder = async (req, res) => {
  try {
    const { _id: userId, role } = req.user; // Get userId and role from the verified token
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
    console.log('User role:', req.user.role); // Debug log

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('items.book', 'title price');

    res.status(200).json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized. User not authenticated.' });
    }

    const { _id: userId } = req.user;
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

    // Record previous status for notification purposes
    const previousStatus = order.status;
    
    // Update status
    order.status = status;
    
    // Mark notification as needed if status changed
    if (previousStatus !== status) {
      order.notificationSent = false;
    }
    
    await order.save();

    console.log('Order status updated successfully:', order);

    // Populate user details for the response
    const populatedOrder = await Order.findById(id)
      .populate('user', 'name email')
      .populate('items.book', 'title price');

    res.status(200).json({ 
      message: 'Order status updated successfully', 
      order: populatedOrder 
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate('items.book'); // Ensure books are populated
    console.log('Order details:', order); // Debug log

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markItemAsReviewed = async (req, res) => {
  try {
    const { orderId, bookId } = req.params;
    const { isReviewed } = req.body;
    const userId = req.user._id;

    console.log(`Marking book ${bookId} as reviewed in order ${orderId}`);
    
    // Validate that the order exists and belongs to the user
    const order = await Order.findOne({ 
      _id: orderId,
      user: userId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found or does not belong to this user' });
    }

    // Find the specific item in the order
    const itemIndex = order.items.findIndex(item => 
      String(item.book) === String(bookId)
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in this order' });
    }

    // Update the isReviewed status
    order.items[itemIndex].isReviewed = isReviewed === true || isReviewed === 'true';
    
    await order.save();

    res.status(200).json({ 
      message: 'Item review status updated successfully',
      isReviewed: order.items[itemIndex].isReviewed
    });
  } catch (error) {
    console.error('Error updating item review status:', error);
    res.status(500).json({ message: 'Failed to update item review status' });
  }
};

// Update order notification status
exports.updateNotificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { notificationSent } = req.body;

    console.log('Request received to update order notification status:', { id, notificationSent });

    if (notificationSent === undefined) {
      console.log('notificationSent is missing in the request body');
      return res.status(400).json({ message: 'notificationSent status is required' });
    }

    const order = await Order.findById(id);
    if (!order) {
      console.log('Order not found with ID:', id);
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update the notification status
    order.notificationSent = notificationSent;
    await order.save();

    console.log('Order notification status updated successfully:', order);

    res.status(200).json({ 
      message: 'Order notification status updated successfully', 
      order 
    });
  } catch (error) {
    console.error('Error updating order notification status:', error);
    res.status(500).json({ message: 'Failed to update order notification status' });
  }
};