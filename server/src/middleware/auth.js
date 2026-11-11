const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { isValidId } = require('../utils/validators');

function readToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

// Requires a valid JWT and an existing, active user. Role comes from the DB, not from the token.
const authenticate = asyncHandler(async (req, res, next) => {
  const token = readToken(req);
  if (!token) throw new ApiError(401, 'Authentication required. Please log in.');
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, err.name === 'TokenExpiredError' ? 'Your session has expired. Please log in again.' : 'Invalid token. Please log in again.');
  }
  const user = await User.findById(payload.id);
  if (!user) throw new ApiError(401, 'This account no longer exists.');
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated.');
  req.user = user;
  next();
});

// Attaches req.user when a valid token is sent; silently continues otherwise (public routes).
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = readToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (user && user.isActive) req.user = user;
  } catch (e) { /* ignore: treated as anonymous */ }
  next();
});

// Role-based authorization enforced on the server.
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'Authentication required. Please log in.'));
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action.'));
  }
  next();
};

// Rejects malformed ObjectIds in route params with a 400.
const validateId = (...params) => (req, res, next) => {
  for (const p of params) {
    if (!isValidId(req.params[p])) return next(new ApiError(400, `Invalid ${p}: not a valid ID.`));
  }
  next();
};

module.exports = { authenticate, optionalAuth, authorize, validateId };
