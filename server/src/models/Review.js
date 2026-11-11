const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
      validate: { validator: Number.isInteger, message: 'Rating must be a whole number' },
    },
    comment: {
      type: String,
      required: [true, 'Review text is required'],
      trim: true,
      minlength: [5, 'Review must be at least 5 characters long'],
      maxlength: [1000, 'Review must be 1000 characters or fewer'],
    },
  },
  { timestamps: true }
);

reviewSchema.index({ customer: 1, restaurant: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
