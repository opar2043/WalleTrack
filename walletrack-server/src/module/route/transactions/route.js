'use strict';

/** Transaction routes. */

const express = require('express');
const { validate } = require('../../../middleware/validate');
const { requireAuth } = require('../../../middleware/auth');
const {
  z,
  objectId,
  amount,
  dateKey,
  optionalNote,
  pagination,
} = require('../../../utils/validators');
const {
  TRANSACTION_TYPES,
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require('./transactions');

const router = express.Router();

const idParam = z.object({ id: objectId });

const listQuery = pagination.extend({
  type: z.enum(TRANSACTION_TYPES).optional(),
  accountId: objectId.optional(),
  categoryId: objectId.optional(),
  from: dateKey.optional(),
  to: dateKey.optional(),
  search: z.string().trim().max(80).optional(),
  minAmount: z.coerce.number().int().min(0).optional(),
  maxAmount: z.coerce.number().int().min(0).optional(),
});

const baseBody = {
  type: z.enum(TRANSACTION_TYPES),
  amount,
  accountId: objectId,
  toAccountId: objectId.optional().nullable(),
  categoryId: objectId.optional().nullable(),
  date: dateKey.optional(),
  note: optionalNote,
};

const createSchema = z.object(baseBody);
const updateSchema = z.object({
  type: z.enum(TRANSACTION_TYPES).optional(),
  amount: amount.optional(),
  accountId: objectId.optional(),
  toAccountId: objectId.optional().nullable(),
  categoryId: objectId.optional().nullable(),
  date: dateKey.optional(),
  note: optionalNote,
});

router.use(requireAuth);

router.get('/', validate({ query: listQuery }), listTransactions);
router.post('/', validate({ body: createSchema }), createTransaction);
router.get('/:id', validate({ params: idParam }), getTransaction);
router.patch('/:id', validate({ params: idParam, body: updateSchema }), updateTransaction);
router.delete('/:id', validate({ params: idParam }), deleteTransaction);

module.exports = router;
