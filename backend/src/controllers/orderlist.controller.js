const OrderList = require('../models/orderlist.model');
const Book = require('../models/book.model'); // Assuming you have a Book model

// Add to OrderList (Cart)
exports.addToOrderList = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const user_id = req.user._id; // Get user ID from authenticated request

    if (!product_id || !quantity) {
      return res.status(400).json({ message: 'Product ID and Quantity are required.' });
    }

    // Verify product existence
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Check if the product already exists in the user's order list
    const existingOrder = await OrderList.findOne({ product_id, user_id });

    if (existingOrder) {
      existingOrder.quantity += quantity;
      await existingOrder.save();
      return res.status(200).json({
        message: 'Order list updated successfully.',
        order: existingOrder
      });
    }

    // Create new order
    const newOrder = new OrderList({
      product_id,
      user_id,
      quantity
    });

    await newOrder.save();

    res.status(201).json({
      message: 'Product added to order list successfully.',
      order: newOrder
    });
  } catch (error) {
    console.error('Error adding to order list:', error);
    res.status(500).json({ message: 'Failed to add product to order list.' });
  }
};

// Save OrderList to Async/Secure Storage (for mobile apps)
exports.saveToStorage = async (req, res) => {
  try {
    const user_id = req.user._id;

    // Fetch all order list items for the user
    const orderListItems = await OrderList.find({ user: user_id }).populate('product');

    if (orderListItems.length === 0) {
      return res.status(200).json({ message: 'No items in the order list to save.' });
    }

    // Format the order list for storage
    const formattedOrderList = orderListItems.map((item) => ({
      book_id: item.product._id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
    }));

    // Simulate saving to async/secure storage (e.g., for mobile apps)
    // Replace this with actual storage logic for your platform (e.g., AsyncStorage for React Native)
    console.log('Saving to storage:', JSON.stringify(formattedOrderList, null, 2));

    res.status(200).json({
      message: 'Order list saved to storage successfully.',
      orderList: formattedOrderList,
    });
  } catch (error) {
    console.error('Error saving order list to storage:', error);
    res.status(500).json({ message: 'Failed to save order list to storage.' });
  }
};