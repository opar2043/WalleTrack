'use strict';

/**
 * ObjectId helpers.
 *
 * The MongoDB driver no longer casts a string to an ObjectId inside a query
 * filter, so every id that arrives from a URL parameter or a header must be
 * converted explicitly. `toObjectId` is the single place that happens.
 */

const { ObjectId } = require('mongodb');

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

/** Returns an ObjectId, or null when the value is not a usable id. */
function toObjectId(value) {
  if (value instanceof ObjectId) return value;
  // A value produced by a second copy of the driver is still a valid id.
  if (value && typeof value === 'object' && value._bsontype === 'ObjectId') return value;
  if (typeof value === 'string' && OBJECT_ID_PATTERN.test(value.trim())) {
    return new ObjectId(value.trim());
  }
  return null;
}

/** Same as toObjectId but throws for invalid input. Use after validation. */
function requireObjectId(value, label = 'id') {
  const objectId = toObjectId(value);
  if (!objectId) throw new TypeError(`Invalid ${label}: ${value}`);
  return objectId;
}

module.exports = { ObjectId, OBJECT_ID_PATTERN, toObjectId, requireObjectId };
