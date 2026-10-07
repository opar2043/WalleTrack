'use strict';

/** User routes. */

const express = require('express');
const { validate } = require('../../../middleware/validate');
const { requireAuth } = require('../../../middleware/auth');
const { z, name, email, currencyCode, countryCode } = require('../../../utils/validators');
const {
  getProfile,
  updateProfile,
  completeOnboarding,
  setPreferences,
  deleteAccount,
} = require('./users');

const router = express.Router();

const updateSchema = z.object({
  name: name.optional(),
  email: email.optional(),
  avatarColor: z
    .string()
    .trim()
    .regex(/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i, 'Use a hex colour.')
    .optional(),
});

const onboardingSchema = z.object({
  country: countryCode,
  currency: currencyCode,
  locale: z.string().trim().max(20).optional(),
});

const preferencesSchema = z.object({
  themePreference: z.enum(['light', 'dark', 'system']).optional(),
  notificationsEnabled: z.boolean().optional(),
  hideBalances: z.boolean().optional(),
  country: countryCode.optional(),
  currency: currencyCode.optional(),
  locale: z.string().trim().max(20).optional(),
});

router.use(requireAuth);

router.get('/me', getProfile);
router.patch('/me', validate({ body: updateSchema }), updateProfile);
router.post('/me/onboarding', validate({ body: onboardingSchema }), completeOnboarding);
router.patch('/me/preferences', validate({ body: preferencesSchema }), setPreferences);
router.delete('/me', deleteAccount);

module.exports = router;
