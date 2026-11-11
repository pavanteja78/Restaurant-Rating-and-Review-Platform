const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { validateUser, str } = require('../utils/validators');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// Public registration always creates a customer. Owners/admins are created by an administrator.
exports.register = asyncHandler(async (req, res) => {
  const { errors, data } = validateUser(req.body || {});
  if (Object.keys(errors).length) throw new ApiError(400, 'Validation failed', errors);

  if (await User.exists({ email: data.email })) {
    throw new ApiError(409, 'An account with this email already exists.');
  }
  const user = await User.create({ ...data, role: 'customer' });
  res.status(201).json({ token: signToken(user), user: user.toSafeJSON() });
});

exports.login = asyncHandler(async (req, res) => {
  const email = str(req.body?.email).toLowerCase();
  const password = req.body?.password;
  const errors = {};
  if (!email) errors.email = 'Email is required.';
  if (typeof password !== 'string' || !password) errors.password = 'Password is required.';
  if (Object.keys(errors).length) throw new ApiError(400, 'Validation failed', errors);

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password.');
  }
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated.');
  res.json({ token: signToken(user), user: user.toSafeJSON() });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});
