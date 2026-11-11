const Review = require('../models/Review');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ratingError, commentError, escapeRegex, isValidId, str } = require('../utils/validators');

function validateReview(body) {
  const errors = {};
  const r = ratingError(body.rating);
  if (r) errors.rating = r;
  const c = commentError(body.comment);
  if (c) errors.comment = c;
  if (Object.keys(errors).length) throw new ApiError(400, 'Validation failed', errors);
}

// GET /api/restaurants/:id/reviews (public)
exports.listForRestaurant = asyncHandler(async (req, res) => {
  if (!(await Restaurant.exists({ _id: req.params.id }))) throw new ApiError(404, 'Restaurant not found.');
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  const filter = { restaurant: req.params.id };
  const [reviews, total] = await Promise.all([
    Review.find(filter).populate('customer', 'name').sort('-createdAt').skip((page - 1) * limit).limit(limit),
    Review.countDocuments(filter),
  ]);
  res.json({ reviews, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
});

// POST /api/restaurants/:id/reviews (customer)
exports.create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  validateReview(body);
  if (!(await Restaurant.exists({ _id: req.params.id }))) throw new ApiError(404, 'Restaurant not found.');

  const existing = await Review.exists({ customer: req.user._id, restaurant: req.params.id });
  if (existing) {
    throw new ApiError(409, 'You have already reviewed this restaurant. You can edit your existing review instead.');
  }
  // The unique index is the real guard; a race between two requests surfaces as E11000 -> 409.
  const review = await Review.create({
    customer: req.user._id,
    restaurant: req.params.id,
    rating: body.rating,
    comment: body.comment,
  });
  res.status(201).json({ review });
});

// PUT /api/reviews/:id (customer, own review only)
exports.update = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found.');
  if (!review.customer.equals(req.user._id)) throw new ApiError(403, 'You can only edit your own review.');
  validateReview(body);
  review.rating = body.rating;
  review.comment = body.comment;
  await review.save();
  res.json({ review });
});

// DELETE /api/reviews/:id (customer: own review; admin: any review)
exports.remove = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found.');
  const isOwn = review.customer.equals(req.user._id);
  if (req.user.role !== 'admin' && !isOwn) throw new ApiError(403, 'You can only delete your own review.');
  await review.deleteOne();
  res.json({ message: 'Review deleted.' });
});

// GET /api/admin/reviews?search=&rating=&restaurant=&page=&limit= (admin)
exports.adminList = asyncHandler(async (req, res) => {
  const filter = {};
  const rating = parseInt(req.query.rating, 10);
  if (req.query.rating && !(rating >= 1 && rating <= 5)) throw new ApiError(400, 'Rating filter must be between 1 and 5.');
  if (rating) filter.rating = rating;
  if (req.query.restaurant) {
    if (!isValidId(req.query.restaurant)) throw new ApiError(400, 'Invalid restaurant ID.');
    filter.restaurant = req.query.restaurant;
  }
  const search = str(req.query.search);
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: 'i' };
    const [restaurants, users] = await Promise.all([
      Restaurant.find({ name: rx }).select('_id'),
      User.find({ $or: [{ name: rx }, { email: rx }] }).select('_id'),
    ]);
    filter.$or = [
      { comment: rx },
      { restaurant: { $in: restaurants.map((r) => r._id) } },
      { customer: { $in: users.map((u) => u._id) } },
    ];
  }
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('customer', 'name email')
      .populate('restaurant', 'name location')
      .sort('-createdAt').skip((page - 1) * limit).limit(limit),
    Review.countDocuments(filter),
  ]);
  res.json({ reviews, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
});
