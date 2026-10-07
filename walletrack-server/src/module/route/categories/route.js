'use strict';

/** Category routes. */

const express = require('express');
const { validate } = require('../../../middleware/validate');
const { requireAuth } = require('../../../middleware/auth');
const { z, objectId, name, hexColor } = require('../../../utils/validators');
const { listCategories, createCategory, updateCategory, deleteCategory } = require('./categories');

const router = express.Router();

const idParam = z.object({ id: objectId });
const listQuery = z.object({ type: z.enum(['income', 'expense']).optional() });
const createSchema = z.object({
  name,
  type: z.enum(['income', 'expense']),
  icon: z.string().trim().max(40).optional(),
  color: hexColor.optional(),
});
const updateSchema = z.object({
  name: name.optional(),
  icon: z.string().trim().max(40).optional(),
  color: hexColor.optional(),
});

router.use(requireAuth);

router.get('/', validate({ query: listQuery }), listCategories);
router.post('/', validate({ body: createSchema }), createCategory);
router.patch('/:id', validate({ params: idParam, body: updateSchema }), updateCategory);
router.delete('/:id', validate({ params: idParam }), deleteCategory);

module.exports = router;
