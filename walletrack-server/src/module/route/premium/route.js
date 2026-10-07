'use strict';

/** Premium routes. */

const express = require('express');
const { validate } = require('../../../middleware/validate');
const { requireAuth } = require('../../../middleware/auth');
const { z } = require('../../../utils/validators');
const {
  getStatus,
  getPlans,
  getLimits,
  verifyPurchase,
  restorePurchase,
  cancelPremium,
} = require('./premium');

const router = express.Router();

const purchaseSchema = z.object({
  productId: z.string().trim().min(1, 'productId is required.'),
  purchaseToken: z.string().trim().min(1, 'purchaseToken is required.'),
});

router.get('/plans', getPlans);

router.use(requireAuth);

router.get('/status', getStatus);
router.get('/limits', getLimits);
router.post('/purchase', validate({ body: purchaseSchema }), verifyPurchase);
router.post('/restore', validate({ body: purchaseSchema }), restorePurchase);
router.post('/cancel', cancelPremium);

module.exports = router;
