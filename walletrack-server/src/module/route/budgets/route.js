'use strict';

/** Budget routes. */

const express = require('express');
const { validate } = require('../../../middleware/validate');
const { requireAuth } = require('../../../middleware/auth');
const { z, objectId, amount, monthKey, optionalNote } = require('../../../utils/validators');
const { listBudgets, createBudget, updateBudget, deleteBudget, copyBudgets } = require('./budgets');

const router = express.Router();

const idParam = z.object({ id: objectId });

const listQuery = z.object({ month: monthKey });

const createSchema = z.object({
  month: monthKey,
  categoryId: objectId.optional().nullable(),
  limit: amount,
  note: optionalNote,
});

const updateSchema = z.object({
  limit: amount.optional(),
  month: monthKey.optional(),
  categoryId: objectId.optional().nullable(),
  note: optionalNote,
});

const copySchema = z.object({
  fromMonth: monthKey,
  toMonth: monthKey.optional(),
});

router.use(requireAuth);

router.get('/', validate({ query: listQuery }), listBudgets);
router.post('/', validate({ body: createSchema }), createBudget);
router.post('/copy', validate({ body: copySchema }), copyBudgets);
router.patch('/:id', validate({ params: idParam, body: updateSchema }), updateBudget);
router.delete('/:id', validate({ params: idParam }), deleteBudget);

module.exports = router;
