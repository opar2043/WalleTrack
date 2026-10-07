'use strict';

/** Analytics routes. */

const express = require('express');
const { validate } = require('../../../middleware/validate');
const { requireAuth } = require('../../../middleware/auth');
const { z, objectId, monthKey } = require('../../../utils/validators');
const { getMonthlyAnalytics, getCategoryDetail, getAvailableMonths } = require('./analytics');

const router = express.Router();

const monthQuery = z.object({ month: monthKey.optional() });

router.use(requireAuth);

router.get('/monthly', validate({ query: monthQuery }), getMonthlyAnalytics);
router.get('/months', getAvailableMonths);
router.get(
  '/categories/:categoryId',
  validate({ params: z.object({ categoryId: objectId }), query: monthQuery }),
  getCategoryDetail,
);

module.exports = router;
