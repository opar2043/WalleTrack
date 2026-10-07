'use strict';

/**
 * Money handling.
 *
 * DECISION: every monetary amount is stored and computed as an **integer in the
 * smallest currency unit** (e.g. cents, paise, fils). Floats are never used for
 * balances. The HTTP API speaks the same integer unit: the client sends
 * `amount` as an integer number of minor units and formats it for display only.
 *
 * Keeping one unit end-to-end means additions are exact and a balance is always
 * a single field on the account document, which makes the balance correct by
 * construction instead of by aggregation.
 */

const MAX_AMOUNT_MINOR = 1_000_000_000_000; // 1e12 minor units = 10 billion major units

function assertMinorAmount(value, label = 'amount') {
  if (!Number.isInteger(value)) {
    throw new TypeError(`${label} must be an integer in the smallest currency unit.`);
  }
  if (value > MAX_AMOUNT_MINOR) {
    throw new RangeError(`${label} is too large.`);
  }
  return value;
}

/** Signed effect of a transaction on a single account balance. */
function signedDeltaFor(transaction) {
  if (transaction.type === 'income') return transaction.amount;
  if (transaction.type === 'expense') return -transaction.amount;
  return 0;
}

module.exports = { assertMinorAmount, signedDeltaFor, MAX_AMOUNT_MINOR };
