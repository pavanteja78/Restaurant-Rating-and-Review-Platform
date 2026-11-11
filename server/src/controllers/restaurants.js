const Restaurant = require('../models/Restaurant');
const Review = require('../models/Review');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  OWNER_FIELDS, ADMIN_FIELDS, isValidId, escapeRegex, exactCI, str, validateRestaurant,
} = require('../utils/validators');
const { oid, getDistribution, restaurantPipeline } = require('../utils/ratings');

const SORTS = {
  name: { name: 1 },
  rating: { averageRating: -1, reviewCount: -1, name: 1 },
  reviews: { reviewCount: -1, name: 1 },
};

// Loads one restaurant with stats (+ myRating for the signed-in user). Owner info only for admins.
async function fetchOne(id, user) {
  const [item] = await Restaurant.aggregate(restaurantPipeline({ _id: oid(id) }, user && user._id));
  if (!item) return null;
  if (user && user.role === 'admin') await Restaurant.populate(item, { path: 'owner', select: 'name email' });
  else delete item.owner;
  return item;
}

// Validates an owner id and ensures the owner is free. Returns ObjectId or null.
async function resolveOwner(ownerId, selfId) {
  if (ownerId === null || ownerId === '' || ownerId === undefined) return null;
  if (!isValidId(ownerId)) throw new ApiError(400, 'Invalid owner ID.');
  const user = await User.findById(ownerId);
  if (!user) throw new ApiError(404, 'Owner account not found.');
  if (user.role !== 'owner') throw new ApiError(400, 'The selected user does not have the restaurant owner role.');
  const query = { owner: user._id };
  if (selfId) query._id = { $ne: selfId };
  const taken = await Restaurant.findOne(query).select('name');
  if (taken) throw new ApiError(409, `This owner is already assigned to "${taken.name}".`);
  return user._id;
}

// GET /api/restaurants?search=&location=&cuisine=&sort=&page=&limit=
// Search + filters run in MongoDB; stats come from an aggregation pipeline.
exports.list = asyncHandler(async (req, res) => {
  const match = {};
  const search = str(req.query.search);
  const location = str(req.query.location);
  const cuisine = str(req.query.cuisine);
  if (search) match.name = { $regex: escapeRegex(search), $options: 'i' };
  if (location) match.location = exactCI(location);
  if (cuisine) match.cuisine = exactCI(cuisine);

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  const sort = SORTS[req.query.sort] || SORTS.name;

  const [result] = await Restaurant.aggregate([
    ...restaurantPipeline(match, req.user && req.user._id),
    { $sort: sort },
    {
      $facet: {
        items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        total: [{ $count: 'n' }],
      },
    },
  ]);
  const items = result.items;
  const total = result.total[0] ? result.total[0].n : 0;

  if (req.user && req.user.role === 'admin') await Restaurant.populate(items, { path: 'owner', select: 'name email' });
  else items.forEach((i) => delete i.owner);

  res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
});

// GET /api/restaurants/filters -> values for the location/cuisine dropdowns
exports.filters = asyncHandler(async (req, res) => {
  const [locations, cuisines] = await Promise.all([
    Restaurant.distinct('location'),
    Restaurant.distinct('cuisine'),
  ]);
  const sorter = (a, b) => a.localeCompare(b);
  res.json({ locations: locations.sort(sorter), cuisines: cuisines.sort(sorter) });
});

exports.getOne = asyncHandler(async (req, res) => {
  const restaurant = await fetchOne(req.params.id, req.user);
  if (!restaurant) throw new ApiError(404, 'Restaurant not found.');
  const { distribution, total } = await getDistribution({ restaurant: oid(req.params.id) });
  let myReview = null;
  if (req.user && req.user.role === 'customer') {
    myReview = await Review.findOne({ restaurant: req.params.id, customer: req.user._id });
  }
  res.json({ restaurant, distribution, totalRatings: total, myReview });
});

exports.distribution = asyncHandler(async (req, res) => {
  if (!(await Restaurant.exists({ _id: req.params.id }))) throw new ApiError(404, 'Restaurant not found.');
  res.json(await getDistribution({ restaurant: oid(req.params.id) }));
});

// POST /api/restaurants (admin)
exports.create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const { errors, data } = validateRestaurant(body, ADMIN_FIELDS, true);
  if (Object.keys(errors).length) throw new ApiError(400, 'Validation failed', errors);
  data.owner = await resolveOwner(body.owner);
  const created = await Restaurant.create(data);
  res.status(201).json({ restaurant: await fetchOne(created._id, req.user) });
});

// PUT /api/restaurants/:id (admin: everything; owner: only own restaurant, limited fields)
exports.update = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) throw new ApiError(404, 'Restaurant not found.');

  const isAdmin = req.user.role === 'admin';
  if (!isAdmin) {
    if (!restaurant.owner || !restaurant.owner.equals(req.user._id)) {
      throw new ApiError(403, 'You can only update your own restaurant.');
    }
    const forbidden = Object.keys(body).filter((k) => !OWNER_FIELDS.includes(k));
    if (forbidden.length) throw new ApiError(403, `Restaurant owners cannot change: ${forbidden.join(', ')}.`);
  }

  const { errors, data } = validateRestaurant(body, isAdmin ? ADMIN_FIELDS : OWNER_FIELDS, false);
  if (Object.keys(errors).length) throw new ApiError(400, 'Validation failed', errors);
  if (isAdmin && 'owner' in body) data.owner = await resolveOwner(body.owner, restaurant._id);

  restaurant.set(data);
  await restaurant.save();
  res.json({ restaurant: await fetchOne(restaurant._id, req.user) });
});

// PUT /api/restaurants/:id/owner (admin) body: { ownerId: "<id>" | null }
exports.assignOwner = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) throw new ApiError(404, 'Restaurant not found.');
  restaurant.owner = await resolveOwner(req.body?.ownerId, restaurant._id);
  await restaurant.save();
  res.json({ restaurant: await fetchOne(restaurant._id, req.user) });
});

// DELETE /api/restaurants/:id (admin) - also removes its reviews
exports.remove = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
  if (!restaurant) throw new ApiError(404, 'Restaurant not found.');
  const { deletedCount } = await Review.deleteMany({ restaurant: restaurant._id });
  res.json({ message: `Restaurant deleted along with ${deletedCount} review(s).` });
});

// ---- Owner endpoints ----

// GET /api/owner/restaurant
exports.ownerRestaurant = asyncHandler(async (req, res) => {
  const mine = await Restaurant.findOne({ owner: req.user._id }).select('_id');
  if (!mine) throw new ApiError(404, 'No restaurant is assigned to your account yet. Please contact an administrator.');
  const restaurant = await fetchOne(mine._id, req.user);
  const { distribution, total } = await getDistribution({ restaurant: mine._id });
  res.json({ restaurant, distribution, totalRatings: total });
});

// GET /api/owner/reviews - reviews for the owner's restaurant, including the customers who wrote them
exports.ownerReviews = asyncHandler(async (req, res) => {
  const mine = await Restaurant.findOne({ owner: req.user._id }).select('_id');
  if (!mine) throw new ApiError(404, 'No restaurant is assigned to your account yet. Please contact an administrator.');
  const reviews = await Review.find({ restaurant: mine._id })
    .populate('customer', 'name email')
    .sort('-createdAt');
  res.json({ reviews, total: reviews.length });
});
