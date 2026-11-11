const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Server error.';
  let errors = err.errors;

  if (err.name === 'ValidationError' && err.errors && !(err instanceof ApiError)) {
    status = 400;
    message = 'Validation failed';
    errors = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}.`;
  } else if (err.code === 11000) {
    status = 409;
    const key = Object.keys(err.keyPattern || {});
    if (key.includes('customer') && key.includes('restaurant')) message = 'You have already reviewed this restaurant.';
    else if (key.includes('email')) message = 'An account with this email already exists.';
    else if (key.includes('owner')) message = 'This owner is already assigned to another restaurant.';
    else message = 'A record with these details already exists.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON.';
  } else if (status === 500) {
    console.error(err);
    message = 'Internal server error. Please try again later.';
  }

  res.status(status).json({ message, ...(errors ? { errors } : {}) });
};

module.exports = { notFound, errorHandler };
