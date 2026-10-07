'use strict';

/** Insights routes. */

const express = require('express');
const { validate } = require('../../../middleware/validate');
const { requireAuth } = require('../../../middleware/auth');
const { z, monthKey } = require('../../../utils/validators');
const { getInsights } = require('./insights');

const router = express.Router();

const query = z.object({ month: monthKey.optional() });

router.use(requireAuth);

router.get('/', validate({ query }), getInsights);

module.exports = router;
