const OrderList = require('../models/orderlist.model');
const Book = require('../models/Book'); // Assuming you have a Book model

// Add to OrderList (Cart)
exports.addToOrderList = async (req, res) => {
  try {
    const { book_id, quantity } = req.body;
    const user_id = req.user._id; // Get user ID from authenticated request

    // Validate input
    if (!book_id || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Book ID and valid quantity are required.' });
    }

    // Check if the book exists
    const book = await Book.findById(book_id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    // Check if the book is already in the user's order list
    const existingOrderListItem = await OrderList.findOne({ product: book_id, user: user_id });

    if (existingOrderListItem) {
      // Update the quantity if the book already exists in the order list
      existingOrderListItem.quantity += quantity;
      await existingOrderListItem.save();
      return res.status(200).json({
        message: 'Order list updated successfully.',
        orderList: existingOrderListItem,
      });
    }

    // Add a new book to the order list
    const newOrderListItem = new OrderList({
      user: user_id,
      product: book_id,
      quantity,
    });

    await newOrderListItem.save();

    res.status(201).json({
      message: 'Book added to order list successfully.',
      orderList: newOrderListItem,
    });
  } catch (error) {
    console.error('Error adding to order list:', error);
    res.status(500).json({ message: 'Failed to add book to order list.' });
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