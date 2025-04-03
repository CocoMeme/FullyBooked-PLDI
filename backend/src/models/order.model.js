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
        enum: ['pending', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
      },
      notificationSent: {
        type: Boolean,
        default: false,
      },
    },
    { timestamps: true }
  );
  
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
