const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 2, maxlength: 100, index: true },
    location: { type: String, required: [true, 'Location is required'], trim: true, maxlength: 100, index: true },
    cuisine: { type: String, required: [true, 'Cuisine is required'], trim: true, maxlength: 60, index: true },
    address: { type: String, trim: true, maxlength: 200, default: '' },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    phone: { type: String, trim: true, maxlength: 30, default: '' },
    openingHours: { type: String, trim: true, maxlength: 200, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

restaurantSchema.index({ owner: 1 }, { unique: true, partialFilterExpression: { owner: { $type: 'objectId' } } });

module.exports = mongoose.model('Restaurant', restaurantSchema);
