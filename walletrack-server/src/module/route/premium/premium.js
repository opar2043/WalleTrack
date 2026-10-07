'use strict';

/**
 * Premium module.
 *
 * Payment integration is an explicit integration point: `restorePurchase` and
 * `verifyPurchase` accept a purchase token from Google Play Billing (directly
 * or via RevenueCat) and this module only records the entitlement. The actual
 * token validation call is `verifyPurchaseToken()` at the bottom of this file
 * — replace its body with your provider call and nothing else changes.
 * See README "Premium & payments integration".
 */

const { collections } = require('../../../config/db');
const { PLANS, limitsFor } = require('../../../config/limits');
const { ApiError, sendSuccess } = require('../../../utils/response');
const { asyncHandler } = require('../../../utils/asyncHandler');
const { toPublicUser } = require('../users/users');

const BENEFITS = [
  {
    id: 'accounts',
    title: 'Unlimited accounts',
    description: 'Cash, bank and card accounts with no caps.',
    icon: 'credit-card',
  },
  {
    id: 'budgets',
    title: 'Unlimited budgets',
    description: 'Track a budget for every category, every month.',
    icon: 'target',
  },
  {
    id: 'analytics',
    title: 'Advanced analytics',
    description: 'Trends, projections and recurring spend detection.',
    icon: 'trending-up',
  },
  {
    id: 'export',
    title: 'Export to CSV & PDF',
    description: 'Take your data anywhere, any time.',
    icon: 'download',
  },
  {
    id: 'categories',
    title: 'Custom categories',
    description: 'Build a category list that fits your life.',
    icon: 'shapes',
  },
  {
    id: 'currency',
    title: 'Multi-currency',
    description: 'Hold and view balances in different currencies.',
    icon: 'globe',
  },
];

function isPremiumActive(user) {
  if (!user.isPremium) return false;
  if (!user.premiumExpiresAt) return true;
  return new Date(user.premiumExpiresAt).getTime() > Date.now();
}

const getStatus = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    data: {
      isPremium: isPremiumActive(req.user),
      status: isPremiumActive(req.user) ? 'active' : 'none',
      planId: req.user.premiumPlanId ?? null,
      expiresAt: req.user.premiumExpiresAt ?? null,
      limits: limitsFor(isPremiumActive(req.user)),
    },
  }),
);

const getPlans = asyncHandler(async (_req, res) =>
  sendSuccess(res, {
    data: {
      plans: PLANS.map((plan) => ({
        ...plan,
        /** Display price per month, useful for the "Best value" comparison. */
        pricePerMonthMinor:
          plan.period === 'yearly' ? Math.round(plan.priceMinor / 12) : plan.priceMinor,
      })),
      benefits: BENEFITS,
    },
  }),
);

/** Free-tier limits, so the client never hard-codes them. */
const getLimits = asyncHandler(async (req, res) =>
  sendSuccess(res, { data: limitsFor(isPremiumActive(req.user)) }),
);

/**
 * INTEGRATION POINT — record a successful purchase.
 * Call this from your billing client once the store confirms the purchase.
 */
const verifyPurchase = asyncHandler(async (req, res) => {
  const { productId, purchaseToken } = req.body;

  const plan = PLANS.find((item) => item.id === productId);
  if (!plan) throw ApiError.badRequest('Unknown product id.');

  const verified = await verifyPurchaseToken(productId, purchaseToken);
  if (!verified) throw ApiError.badRequest('That purchase could not be verified.');

  const expiresAt = new Date(Date.now() + plan.intervalDays * 86_400_000);

  await collections.users.updateOne(
    { _id: req.user._id },
    {
      $set: {
        isPremium: true,
        premiumStatus: 'active',
        premiumPlanId: plan.id,
        premiumExpiresAt: expiresAt,
        premiumPurchaseToken: purchaseToken,
        updatedAt: new Date(),
      },
    },
  );

  const user = await collections.users.findOne(
    { _id: req.user._id },
    { projection: { password: 0 } },
  );
  return sendSuccess(res, { message: 'Premium activated.', data: toPublicUser(user) });
});

const restorePurchase = asyncHandler(async (req, res) => {
  const { productId, purchaseToken } = req.body;

  const plan = PLANS.find((item) => item.id === productId);
  const verified = await verifyPurchaseToken(productId, purchaseToken);
  if (!plan || !verified) {
    throw ApiError.badRequest('No active purchase was found for this account.');
  }

  const expiresAt = new Date(Date.now() + plan.intervalDays * 86_400_000);
  await collections.users.updateOne(
    { _id: req.user._id },
    {
      $set: {
        isPremium: true,
        premiumStatus: 'active',
        premiumPlanId: plan.id,
        premiumExpiresAt: expiresAt,
        premiumPurchaseToken: purchaseToken,
        updatedAt: new Date(),
      },
    },
  );

  const user = await collections.users.findOne(
    { _id: req.user._id },
    { projection: { password: 0 } },
  );
  return sendSuccess(res, { message: 'Purchase restored.', data: toPublicUser(user) });
});

/** Cancels the local entitlement. Play Store subscriptions remain authoritative. */
const cancelPremium = asyncHandler(async (req, res) => {
  await collections.users.updateOne(
    { _id: req.user._id },
    {
      $set: {
        isPremium: false,
        premiumStatus: 'none',
        premiumPlanId: null,
        premiumExpiresAt: null,
        updatedAt: new Date(),
      },
    },
  );

  const user = await collections.users.findOne(
    { _id: req.user._id },
    { projection: { password: 0 } },
  );
  return sendSuccess(res, { message: 'Premium cancelled.', data: toPublicUser(user) });
});

/**
 * INTEGRATION POINT — verify a purchase token with the store.
 *
 * Currently a permissive stub so the flow is testable end to end. Replace the
 * body with a real call, for example:
 *
 *   const res = await fetch(
 *     `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${SERVICE_ACCOUNT_EMAIL}/purchases/subscriptionsv2/tokens/${purchaseToken}`,
 *     { headers: { Authorization: `Bearer ${serviceAccountAccessToken}` } },
 *   );
 *   const body = await res.json();
 *   return res.ok && body.subscriptionState === 'SUBSCRIPTION_STATE_ACTIVE';
 *
 * With RevenueCat, forward the token to your own endpoint or verify the
 * RevenueCat webhook and return true here.
 */
async function verifyPurchaseToken(_productId, _purchaseToken) {
  return true;
}

module.exports = {
  BENEFITS,
  isPremiumActive,
  getStatus,
  getPlans,
  getLimits,
  verifyPurchase,
  restorePurchase,
  cancelPremium,
  verifyPurchaseToken,
};
