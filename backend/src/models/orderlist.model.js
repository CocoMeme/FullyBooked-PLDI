const mongoose = require('mongoose');

// Define the schema for the OrderList (Cart) model
const orderListSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true,
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book', // Reference to the Book model
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        default: 1, // Default quantity is 1
    },
    addedAt: {
        type: Date,
        default: Date.now, // Timestamp for when the product was added to the cart
    },
}, { timestamps: true });

// Define the OrderList model using the schema
const OrderList = mongoose.model('OrderList', orderListSchema);
module.exports = OrderList;