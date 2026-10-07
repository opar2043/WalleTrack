/**
 * Class-name maps that let NativeWind switch between the light and dark
 * palettes without duplicating every class string in a screen.
 *
 * `cn('bg-surface', 'dark:bg-surfaceElevated')` picks the light value by day
 * and the dark value at night. `colorVar('expense')` resolves a token to a real
 * hex value for the handful of APIs (charts, SVG, navigation themes) that
 * cannot take a class name.
 */

import { darkPalette, lightPalette, type ThemePalette } from './tokens';

export const colorVar = (token: keyof ThemePalette, isDark: boolean): string =>
  (isDark ? darkPalette : lightPalette)[token];

export const cn = (...classes: (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(' ');

/** Semantic tint class pairs for a status/transaction type. */
export const toneClasses = {
  income: { text: 'text-income', bg: 'bg-income-soft', border: 'border-income' },
  expense: { text: 'text-expense', bg: 'bg-expense-soft', border: 'border-expense' },
  transfer: { text: 'text-transfer', bg: 'bg-transfer-soft', border: 'border-transfer' },
  warning: { text: 'text-warning', bg: 'bg-warning-soft', border: 'border-warning' },
  danger: { text: 'text-danger', bg: 'bg-danger-soft', border: 'border-danger' },
  success: { text: 'text-success', bg: 'bg-success-soft', border: 'border-success' },
  neutral: { text: 'text-contentSecondary', bg: 'bg-surfaceSunken', border: 'border-border' },
} as const;

export type ToneName = keyof typeof toneClasses;

/** Deterministic accent for a category/account so lists stay visually stable. */
export const AVATAR_COLORS = [
  '#4F46E5',
  '#0284C7',
  '#0891B2',
  '#059669',
  '#65A30D',
  '#CA8A04',
  '#EA580C',
  '#DC2626',
  '#DB2777',
  '#9333EA',
] as const;

export function avatarColorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
