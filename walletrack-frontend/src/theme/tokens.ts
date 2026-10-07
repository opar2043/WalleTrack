/**
 * Design tokens. Every colour, radius, spacing and type size used by the app is
 * declared here once, mirrored into `tailwind.config.js`, and consumed by
 * NativeWind class names. Screens never hard-code a hex value.
 */

export type ThemeName = 'light' | 'dark';

export type ThemePalette = {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceSunken: string;
  border: string;
  borderStrong: string;
  content: string;
  contentSecondary: string;
  contentMuted: string;
  primary: string;
  primaryHover: string;
  primarySoft: string;
  income: string;
  incomeSoft: string;
  expense: string;
  expenseSoft: string;
  transfer: string;
  transferSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  overlay: string;
};

export const lightPalette: ThemePalette = {
  background: '#F6F6F6',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceSunken: '#EFEFEF',
  border: '#E4E4E7',
  borderStrong: '#D4D4D8',
  content: '#18181B',
  contentSecondary: '#52525B',
  contentMuted: '#8B8B94',
  primary: '#4F46E5',
  primaryHover: '#4338CA',
  primarySoft: '#EEF2FF',
  income: '#059669',
  incomeSoft: '#ECFDF5',
  expense: '#DC2626',
  expenseSoft: '#FEF2F2',
  transfer: '#0284C7',
  transferSoft: '#F0F9FF',
  warning: '#D97706',
  warningSoft: '#FFFBEB',
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
  success: '#059669',
  successSoft: '#ECFDF5',
  overlay: 'rgba(24,24,27,0.45)',
};

export const darkPalette: ThemePalette = {
  background: '#09090B',
  surface: '#18181B',
  surfaceElevated: '#27272A',
  surfaceSunken: '#0F0F11',
  border: '#2E2E33',
  borderStrong: '#3F3F46',
  content: '#FAFAFA',
  contentSecondary: '#B4B4BD',
  contentMuted: '#77777F',
  primary: '#818CF8',
  primaryHover: '#A5B4FC',
  primarySoft: '#1E1B4B',
  income: '#34D399',
  incomeSoft: '#06281F',
  expense: '#F87171',
  expenseSoft: '#2C1213',
  transfer: '#38BDF8',
  transferSoft: '#08283A',
  warning: '#FBBF24',
  warningSoft: '#2A1D05',
  danger: '#F87171',
  dangerSoft: '#2C1213',
  success: '#34D399',
  successSoft: '#06281F',
  overlay: 'rgba(0,0,0,0.6)',
};

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 32,
  pill: 999,
} as const;

export const spacing = {
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
} as const;

export const fontSize = {
  '2xs': 10,
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 44,
} as const;

export type ThemeMetrics = {
  radius: typeof radius;
  spacing: typeof spacing;
  fontSize: typeof fontSize;
  /** Minimum touch target on both platforms. */
  hitSize: number;
  screenPadding: number;
  tabBarHeight: number;
  headerHeight: number;
};

export const metrics: ThemeMetrics = {
  radius,
  spacing,
  fontSize,
  hitSize: 44,
  screenPadding: 20,
  tabBarHeight: 64,
  headerHeight: 56,
};

/** Elevation presets. Android uses `elevation`, iOS uses the shadow props. */
export const elevation = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
} as const;

export type ElevationName = keyof typeof elevation;
