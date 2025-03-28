const mongoose = require('mongoose');

// Define the schema for the Order model
const orderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    address: {
        city: {
            type: String,
            required: true,
        },
        country: String,
        state: String,
        zipcode: String,
    },
    phone: {
        type: Number,
        required: true,
    },
    productIds: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book',
            required: true,
        }
    ],
    totalPrice: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipping', 'Delivered'],
        default: 'Pending',  // Orders start with 'Pending' status
        required: true,
    },
    courier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // Assuming a "User" model for couriers
        default: null,  // Initially, no courier is assigned
    },
    deliveredAt: {
        type: Date,  // Timestamp for when the order is delivered
        default: null,
    },
}, { timestamps: true });

// Middleware to handle status updates
orderSchema.pre('save', function(next) {
    // If order is delivered, set deliveredAt timestamp
    if (this.status === 'Delivered' && !this.deliveredAt) {
        this.deliveredAt = new Date();
    }
    next();
});

// Define the Order model using the schema
const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
