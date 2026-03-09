
// Standard error object used across controllers/services.
// Controllers throw ApiError and central middleware formats response
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ApiError;