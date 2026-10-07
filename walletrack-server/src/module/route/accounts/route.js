'use strict';

/** Account routes. */

const express = require('express');
const { validate } = require('../../../middleware/validate');
const { requireAuth } = require('../../../middleware/auth');
const {
  z,
  objectId,
  name,
  startingBalance,
  hexColor,
  optionalNote,
} = require('../../../utils/validators');
const {
  ACCOUNT_TYPES,
  listAccounts,
  getAccount,
  createAccount,
  updateAccount,
  archiveAccount,
  deleteAccount,
} = require('./accounts');

const router = express.Router();

const idParam = z.object({ id: objectId });

const listQuery = z.object({
  includeArchived: z.enum(['true', 'false']).optional(),
});

const createSchema = z.object({
  name,
  type: z.enum(ACCOUNT_TYPES),
  startingBalance: startingBalance.default(0),
  color: hexColor.optional(),
  icon: z.string().trim().max(40).optional(),
  note: optionalNote,
});

const updateSchema = z.object({
  name: name.optional(),
  startingBalance: startingBalance.optional(),
  color: hexColor.optional(),
  icon: z.string().trim().max(40).optional(),
  note: optionalNote,
  isArchived: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

const archiveSchema = z.object({ isArchived: z.boolean().default(true) });

router.use(requireAuth);

router.get('/', validate({ query: listQuery }), listAccounts);
router.post('/', validate({ body: createSchema }), createAccount);
router.get('/:id', validate({ params: idParam }), getAccount);
router.patch('/:id', validate({ params: idParam, body: updateSchema }), updateAccount);
router.post('/:id/archive', validate({ params: idParam, body: archiveSchema }), archiveAccount);
router.delete('/:id', validate({ params: idParam }), deleteAccount);

module.exports = router;
