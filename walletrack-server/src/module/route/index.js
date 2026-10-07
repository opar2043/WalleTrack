'use strict';

/** Mounts every module route under /api/v1. */

const express = require('express');
const authRoutes = require('./auth/route');
const userRoutes = require('./users/route');
const accountRoutes = require('./accounts/route');
const categoryRoutes = require('./categories/route');
const transactionRoutes = require('./transactions/route');
const budgetRoutes = require('./budgets/route');
const dashboardRoutes = require('./dashboard/route');
const analyticsRoutes = require('./analytics/route');
const insightRoutes = require('./insights/route');
const premiumRoutes = require('./premium/route');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Walletrack API is healthy.',
    data: { status: 'ok', uptime: Math.round(process.uptime()) },
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/accounts', accountRoutes);
router.use('/categories', categoryRoutes);
router.use('/transactions', transactionRoutes);
router.use('/budgets', budgetRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/insights', insightRoutes);
router.use('/premium', premiumRoutes);

module.exports = router;
