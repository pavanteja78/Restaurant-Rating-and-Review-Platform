const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES, escapeRegex, str, validateUser } = require('../utils/validators');
const { getDistribution } = require('../utils/ratings');

// GET /api/admin/stats
exports.stats = asyncHandler(async (req, res) => {
  const [totalUsers, totalRestaurants, totalReviews, avg, dist, roles] = await Promise.all([
    User.countDocuments(),
    Restaurant.countDocuments(),
    Review.countDocuments(),
    Review.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
    getDistribution({}),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
  ]);
  res.json({
    totalUsers,
    totalRestaurants,
    totalReviews,
    averagePlatformRating: avg[0] ? Math.round(avg[0].avg * 10) / 10 : null,
    distribution: dist.distribution,
    usersByRole: Object.fromEntries(roles.map((r) => [r._id, r.count])),
  });
});

// GET /api/admin/users?search=&role=&page=&limit=
exports.listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) {
    if (!ROLES.includes(req.query.role)) throw new ApiError(400, `Role must be one of: ${ROLES.join(', ')}.`);
    filter.role = req.query.role;
  }
  const search = str(req.query.search);
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: 'i' };
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const [users, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ users: users.map((u) => u.toSafeJSON()), total, page, pages: Math.max(Math.ceil(total / limit), 1) });
});

// POST /api/admin/users - create any role (this is how Restaurant Owner accounts are made)
exports.createUser = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const { errors, data } = validateUser(body);
  if (!ROLES.includes(body.role)) errors.role = `Role must be one of: ${ROLES.join(', ')}.`;
  if (Object.keys(errors).length) throw new ApiError(400, 'Validation failed', errors);
  if (await User.exists({ email: data.email })) throw new ApiError(409, 'An account with this email already exists.');
  const user = await User.create({ ...data, role: body.role });
  res.status(201).json({ user: user.toSafeJSON() });
});

// PUT /api/admin/users/:id
exports.updateUser = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');

  const { errors, data } = validateUser(body, { requirePassword: false, partial: true });
  if (body.role !== undefined && !ROLES.includes(body.role)) errors.role = `Role must be one of: ${ROLES.join(', ')}.`;
  if (body.isActive !== undefined && typeof body.isActive !== 'boolean') errors.isActive = 'isActive must be true or false.';
  if (Object.keys(errors).length) throw new ApiError(400, 'Validation failed', errors);

  const isSelf = user._id.equals(req.user._id);
  if (isSelf && body.role !== undefined && body.role !== user.role) throw new ApiError(400, 'You cannot change your own role.');
  if (isSelf && body.isActive === false) throw new ApiError(400, 'You cannot deactivate your own account.');

  if (data.email && data.email !== user.email && (await User.exists({ email: data.email, _id: { $ne: user._id } }))) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const wasOwner = user.role === 'owner';
  user.set(data);
  if (body.role !== undefined) user.role = body.role;
  if (body.isActive !== undefined) user.isActive = body.isActive;
  await user.save();

  // An account that stops being an owner must release its restaurant.
  if (wasOwner && user.role !== 'owner') await Restaurant.updateMany({ owner: user._id }, { owner: null });
  res.json({ user: user.toSafeJSON() });
});

// DELETE /api/admin/users/:id
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  if (user._id.equals(req.user._id)) throw new ApiError(400, 'You cannot delete your own account.');
  await Promise.all([
    Review.deleteMany({ customer: user._id }),
    Restaurant.updateMany({ owner: user._id }, { owner: null }),
  ]);
  await user.deleteOne();
  res.json({ message: 'User deleted.' });
});
