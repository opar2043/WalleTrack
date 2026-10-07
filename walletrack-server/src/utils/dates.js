'use strict';

/**
 * Date helpers.
 *
 * Money apps must agree with the user's calendar, not the server's timezone.
 * Every stored date is therefore normalised to UTC midnight built from the
 * calendar date the client sent. Grouping by day/month reads the UTC parts,
 * so a transaction on "2026-01-01" is always in January for every user.
 *
 * Month keys are strings in `YYYY-MM` form and are the grouping key for
 * budgets and monthly analytics.
 */

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function pad(value) {
  return String(value).padStart(2, '0');
}

/** Accepts Date, "YYYY-MM-DD" or any ISO string. Returns Date at UTC midnight. */
function toUtcMidnight(value) {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (DATE_PATTERN.test(trimmed)) {
      const [year, month, day] = trimmed.split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, day));
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
  }

  return null;
}

function isValidDateKey(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value.trim())) return false;
  const [year, month, day] = value.trim().split('-').map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
}

/** "YYYY-MM-DD" for a Date, read from UTC parts. */
function dateKey(value) {
  const date = value instanceof Date ? value : toUtcMidnight(value);
  if (!date) return null;
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** "YYYY-MM" for a Date, read from UTC parts. */
function monthKey(value) {
  const date = value instanceof Date ? value : toUtcMidnight(value);
  if (!date) return null;
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

function isValidMonthKey(value) {
  return typeof value === 'string' && MONTH_PATTERN.test(value.trim());
}

/** Start (inclusive) and end (exclusive) instants of a month key. */
function monthRange(month) {
  if (!isValidMonthKey(month)) return null;
  const [year, monthPart] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthPart - 1, 1));
  const end = new Date(Date.UTC(year, monthPart, 1));
  return { start, end };
}

function shiftMonth(month, offset) {
  if (!isValidMonthKey(month)) return null;
  const [year, monthPart] = month.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, monthPart - 1 + offset, 1));
  return monthKey(shifted);
}

function addDays(date, days) {
  const base = toUtcMidnight(date);
  const next = new Date(base.getTime() + days * 86_400_000);
  return next;
}

/** The last `days` UTC midnights ending at (and including) today. */
function lastDays(days, today = new Date()) {
  const end = toUtcMidnight(today);
  const list = [];
  for (let index = days - 1; index >= 0; index -= 1) {
    list.push(addDays(end, -index));
  }
  return list;
}

function daysInMonth(month) {
  const [year, monthPart] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthPart, 0)).getUTCDate();
}

module.exports = {
  toUtcMidnight,
  isValidDateKey,
  dateKey,
  monthKey,
  isValidMonthKey,
  monthRange,
  shiftMonth,
  addDays,
  lastDays,
  daysInMonth,
  MONTH_PATTERN,
  DATE_PATTERN,
};
