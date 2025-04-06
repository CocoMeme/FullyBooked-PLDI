const mongoose = require('mongoose');

// Define the schema for the Order model
const orderSchema = new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      items: [
        {
          book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book',
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
          },
          isReviewed: {
            type: Boolean,
            default: false,
          },
        },
      ],
      paymentMethod: {
        type: String,
        enum: ['COD', 'Card', 'PayPal', 'Bank Transfer'],
        default: 'COD',
      },
      totalAmount: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending',
      },
      notificationSent: {
        type: Boolean,
        default: false,
      },
      deliveredAt: {
        type: Date,
        default: null
      }
    },
    { timestamps: true }
  );
  
// Middleware to handle status updates
orderSchema.pre('save', function(next) {
    // If order is delivered, set deliveredAt timestamp
    // Fixed typo from 'pelivered' to 'Delivered'
    if (this.status === 'Delivered' && !this.deliveredAt) {
        this.deliveredAt = new Date();
    }
    next();
});

// Define the Order model using the schema
const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
