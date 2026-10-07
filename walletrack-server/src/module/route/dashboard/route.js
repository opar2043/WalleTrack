'use strict';

/** Dashboard routes. */

const express = require('express');
const { validate } = require('../../../middleware/validate');
const { requireAuth } = require('../../../middleware/auth');
const { z } = require('../../../utils/validators');
const { getDashboard } = require('./dashboard');

const router = express.Router();

const query = z.object({
  range: z.enum(['7', '30']).optional(),
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

router.use(requireAuth);

router.get('/', validate({ query }), getDashboard);

module.exports = router;
