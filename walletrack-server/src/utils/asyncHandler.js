'use strict';

/** Thin re-export so handlers can import the wrapper from its own file. */

const { asyncHandler } = require('./response');

module.exports = { asyncHandler };
