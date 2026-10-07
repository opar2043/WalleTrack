'use strict';

/** Consistent response shape helpers: { success, message, data } and friends. */

function sendSuccess(res, { message = 'OK', data = null, status = 200 } = {}) {
  return res.status(status).json({ success: true, message, data });
}

function sendCreated(res, data, message = 'Created') {
  return sendSuccess(res, { message, data, status: 201 });
}

class ApiError extends Error {
  constructor(status, message, errors = undefined) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }

  static badRequest(message = 'Bad request', errors) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Not authenticated') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Not allowed') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Already exists') {
    return new ApiError(409, message);
  }

  static tooMany(message = 'Too many requests') {
    return new ApiError(429, message);
  }
}

/** Express 5 forwards rejected promises, but we keep this for explicitness. */
function asyncHandler(fn) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { sendSuccess, sendCreated, ApiError, asyncHandler };
