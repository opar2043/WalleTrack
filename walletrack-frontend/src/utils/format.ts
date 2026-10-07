/**
 * Money, date and text formatting. Amounts arrive from the API as integer
 * minor units (cents, pence, yen) and are only divided for display, so no
 * floating point rounding error ever reaches a stored balance.
 */

const MINOR_UNITS: Record<string, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  CAD: 2,
  AUD: 2,
  CHF: 2,
  SEK: 2,
  NOK: 2,
  DKK: 2,
  PLN: 2,
  CZK: 2,
  HUF: 2,
  RON: 2,
  BRL: 2,
  MXN: 2,
  ZAR: 2,
  SGD: 2,
  HKD: 2,
  NZD: 2,
  INR: 2,
  AED: 2,
  ILS: 2,
  JPY: 0,
  KRW: 0,
  VND: 0,
  IDR: 0,
  CLP: 0,
  ISK: 0,
};

export function minorUnitsFor(currency: string): number {
  return MINOR_UNITS[currency.toUpperCase()] ?? 2;
}

function currencyFormatter(currency: string, options?: Intl.NumberFormatOptions) {
  const fractionDigits = minorUnitsFor(currency);
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    ...options,
  });
}

/** `12345` -> `"$123.45"`. */
export function formatMoney(
  amountInMinorUnits: number,
  currency = 'USD',
  options?: Intl.NumberFormatOptions,
): string {
  const divisor = 10 ** minorUnitsFor(currency);
  const safeAmount = Number.isFinite(amountInMinorUnits) ? amountInMinorUnits : 0;
  return currencyFormatter(currency, options).format(safeAmount / divisor);
}

/** Compact variant for chart axes: `$1.2k`. */
export function formatMoneyCompact(amountInMinorUnits: number, currency = 'USD'): string {
  const divisor = 10 ** minorUnitsFor(currency);
  const value = (Number.isFinite(amountInMinorUnits) ? amountInMinorUnits : 0) / divisor;
  const absolute = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (absolute >= 1_000_000) return `${sign}${currencySymbol(currency)}${(absolute / 1_000_000).toFixed(1)}M`;
  if (absolute >= 1000) return `${sign}${currencySymbol(currency)}${(absolute / 1000).toFixed(1)}k`;
  return `${sign}${currencySymbol(currency)}${absolute.toFixed(0)}`;
}

export function currencySymbol(currency: string): string {
  const parts = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).formatToParts(0);
  return parts.find((part) => part.type === 'currency')?.value ?? currency.toUpperCase();
}

/** Always signed, used next to an amount to show direction at a glance. */
export function formatSignedMoney(amountInMinorUnits: number, currency = 'USD'): string {
  const formatted = formatMoney(Math.abs(amountInMinorUnits), currency);
  if (amountInMinorUnits > 0) return `+${formatted}`;
  if (amountInMinorUnits < 0) return `-${formatted}`;
  return formatted;
}

export function formatPercent(value: number, fractionDigits = 0): string {
  if (!Number.isFinite(value)) return '0%';
  return `${value.toFixed(fractionDigits)}%`;
}

/** Converts a decimal string from a text input into integer minor units. */
export function parseAmountToMinorUnits(input: string, currency = 'USD'): number | null {
  const normalized = input.replace(/[\s,]/g, '').replace(/[^0-9.-]/g, '');
  if (normalized === '' || normalized === '-' || normalized === '.') return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  const divisor = 10 ** minorUnitsFor(currency);
  return Math.round(parsed * divisor);
}

/** Converts integer minor units back into a text-input friendly string. */
export function minorUnitsToInput(amountInMinorUnits: number, currency = 'USD'): string {
  const divisor = 10 ** minorUnitsFor(currency);
  const value = (Number.isFinite(amountInMinorUnits) ? amountInMinorUnits : 0) / divisor;
  return minorUnitsFor(currency) === 0 ? String(Math.round(value)) : value.toFixed(2);
}

export const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function monthKeyOf(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function monthLabel(monthKey: string, locale?: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  );
}

export function monthLabelShort(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;
  return new Intl.DateTimeFormat(undefined, { month: 'short' }).format(new Date(year, month - 1, 1));
}

export function addMonths(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return monthKeyOf(date);
}

export function startOfMonth(monthKey: string): Date {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

export function endOfMonth(monthKey: string): Date {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month, 0, 23, 59, 59, 999);
}

export function dateKeyOf(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** `2026-10-05` -> `"Oct 5"`, with the year shown only when it is not this one. */
export function formatTransactionDate(dateKey: string): string {
  if (!dateKey) return '';
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return dateKey;
  const date = new Date(year, month - 1, day);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(date);
}

export function formatDayHeading(dateKey: string): string {
  const today = dateKeyOf();
  if (dateKey === today) return 'Today';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === dateKeyOf(yesterday)) return 'Yesterday';
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${dateKey}T12:00:00`));
}

export function formatWeekdayShort(dateKey: string): string {
  if (!dateKey) return '';
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(
    new Date(`${dateKey}T12:00:00`),
  );
}

export function relativeTimeFromNow(isoDate: string): string {
  const timestamp = new Date(isoDate).getTime();
  if (!Number.isFinite(timestamp)) return '';
  const diffSeconds = Math.round((timestamp - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) {
      return formatter.format(Math.round(diffSeconds / seconds), unit);
    }
  }
  return 'just now';
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}

export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1))}…`;
}
