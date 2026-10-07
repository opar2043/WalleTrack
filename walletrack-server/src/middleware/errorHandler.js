'use strict';

/** Central error handler + 404 handler. Every error leaves as { success:false, message }. */

const { ZodError } = require('zod');
const env = require('../config/env');
const { ApiError } = require('../utils/response');

function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

function normaliseError(error) {
  if (error instanceof ZodError) {
    const errors = error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    }));
    return { status: 400, message: 'Validation failed.', errors };
  }

  if (error instanceof ApiError) {
    return { status: error.status, message: error.message, errors: error.errors };
  }

  // MongoDB duplicate key
  if (error && error.code === 11000) {
    const field = Object.keys(error.keyPattern || { field: 1 })[0];
    return { status: 409, message: `That ${field} is already in use.` };
  }

  if (error && error.type === 'entity.parse.failed') {
    return { status: 400, message: 'Request body is not valid JSON.' };
  }

  return { status: error?.status || 500, message: 'Something went wrong.', errors: undefined };
}

// Express identifies error handlers by their four-argument signature.
function errorHandler(error, req, res, _next) {
  const { status, message, errors } = normaliseError(error);

  if (status >= 500) {
    console.error('[error]', req.method, req.originalUrl, error);
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;
  if (!env.isProduction && status >= 500) body.stack = error?.stack;

  res.status(status).json(body);
}

module.exports = { notFoundHandler, errorHandler };
