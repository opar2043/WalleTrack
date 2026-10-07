'use strict';

/**
 * Reusable zod building blocks so every module validates the same way.
 */

const { z } = require('zod');
const { MAX_AMOUNT_MINOR } = require('./money');
const { DATE_PATTERN, MONTH_PATTERN } = require('./dates');
const { ObjectId, OBJECT_ID_PATTERN } = require('./ids');

/**
 * An id exactly as it arrives on the wire: validated, then converted to an
 * ObjectId so a module can put it straight into a query filter.
 */
const objectId = z
  .string()
  .trim()
  .regex(OBJECT_ID_PATTERN, 'Must be a valid id.')
  .transform((value) => new ObjectId(value));

const email = z
  .string()
  .trim()
  .min(1, 'Email is required.')
  .max(254, 'Email is too long.')
  .email('Enter a valid email address.')
  .transform((value) => value.toLowerCase());

const password = z.string().min(8, 'Use at least 8 characters.').max(128, 'Password is too long.');

const name = z.string().trim().min(1, 'Name is required.').max(60, 'Name is too long.');

const currencyCode = z.string().trim().toUpperCase().length(3, 'Use a 3 letter currency code.');

const countryCode = z.string().trim().toUpperCase().length(2, 'Use a 2 letter country code.');

/** Money: integer minor units, always positive. */
const amount = z
  .number()
  .int('Amount must be a whole number in the smallest currency unit.')
  .positive('Amount must be greater than zero.')
  .max(MAX_AMOUNT_MINOR, 'Amount is too large.');

const startingBalance = z.number().int().min(-MAX_AMOUNT_MINOR).max(MAX_AMOUNT_MINOR);

const hexColor = z
  .string()
  .trim()
  .regex(/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i, 'Use a hex colour such as #4F46E5.');

const dateKey = z.string().trim().regex(DATE_PATTERN, 'Use the format YYYY-MM-DD.');

const monthKey = z.string().trim().regex(MONTH_PATTERN, 'Use the format YYYY-MM.');

const optionalNote = z.string().trim().max(140, 'Note is too long.').optional().or(z.literal(''));

const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

module.exports = {
  z,
  objectId,
  email,
  password,
  name,
  currencyCode,
  countryCode,
  amount,
  startingBalance,
  hexColor,
  dateKey,
  monthKey,
  optionalNote,
  pagination,
};
