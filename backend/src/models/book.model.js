const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['Sci-Fi','Adventure', 'Fiction', 'Business', 'Action', 'Comedy', 'Drama', 'Romance', 'Horror', 'Thriller'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  tag: {
    type: String,
    enum: ['New', 'Sale', 'Hot', 'None'],
    default: 'None',
    required: true,
  },
  stock: {
    type: Number,
    default: 0,
    validate: {
      validator: function(value) {
        return value >= 0;
      },
      message: 'Stock cannot be negative!'
    }
  },
  discountPrice: {
    type: Number,
    validate: {
      validator: function() {
        return this.tag === 'Sale' ? this.discountPrice != null : this.discountPrice == null;
      },
      message: props => `Discount price is only allowed when the tag is 'Sale'.`
    },
  },
  coverImage: {
    type: [String], 
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  averageRating: { type: Number, default: 0 },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
}, { timestamps: true });


const Book = mongoose.model('Book', bookSchema);
module.exports = Book;
