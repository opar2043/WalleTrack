'use strict';

/**
 * Request validation helper.
 *
 * Usage:
 *   router.post('/', validate({ body: createSchema }), handler)
 *
 * The parsed (and coerced) result replaces the raw request part, so handlers
 * always work with validated data. Unknown keys are stripped by zod.
 */

const { ZodError } = require('zod');
const { ApiError } = require('../utils/response');

function validate(schemas) {
  return function validateRequest(req, _res, next) {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
      if (schemas.params) req.params = schemas.params.parse(req.params ?? {});
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query ?? {});
        // Express 5 defines req.query as a getter that re-parses on every access,
        // so coerced values have to be shadowed with an own property.
        Object.defineProperty(req, 'query', {
          value: parsed,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) return next(error);
      next(ApiError.badRequest('Invalid request.'));
    }
  };
}

module.exports = { validate };
