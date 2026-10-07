'use strict';

/** Auth routes. Each line only wires a URL to a controller + middleware. */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { validate } = require('../../../middleware/validate');
const { asyncHandler } = require('../../../utils/asyncHandler');
const { z, email, password, name } = require('../../../utils/validators');
const { requireAuth } = require('../../../middleware/auth');
const { register, login, logout, logoutAll, changePassword } = require('./auth');

const router = express.Router();

/** Strict limiter on credential endpoints only. */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please try again in a few minutes.',
  },
});

const registerSchema = z.object({ name, email, password });
const loginSchema = z.object({ email, password });
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: password,
});

router.post('/register', authLimiter, validate({ body: registerSchema }), register);
router.post('/login', authLimiter, validate({ body: loginSchema }), login);
router.post('/logout', requireAuth, asyncHandler(logout));
router.post('/logout-all', requireAuth, asyncHandler(logoutAll));
router.post(
  '/change-password',
  requireAuth,
  validate({ body: changePasswordSchema }),
  changePassword,
);

module.exports = router;
