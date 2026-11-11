class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors; // optional field-level errors: { field: 'message' }
  }
}
module.exports = ApiError;
