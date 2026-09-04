export const colors = {
  primary: "#6C5CE7",
  primaryLight: "#8B7CF7",
  primaryDark: "#5A4BD1",
  accent: "#FF6B4A",
  accentLight: "#FF8B70",
  accentDark: "#E8532E",
  card: "#1E1E2D",
  cardLight: "#2A2A3C",
  bgLight: "#F5F5F7",
  bgDark: "#121212",
  surfaceLight: "#FFFFFF",
  surfaceDark: "#1E1E2D",
  textPrimary: "#1E1E2D",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  textInverse: "#FFFFFF",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  chartNavy: "#1E1E2D",
  chartOrange: "#FF6B4A",
  chartViolet: "#6C5CE7",
  chartGray: "#6B7280",
} as const;

export const borderRadii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  round: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
} as const;

export const typography = {
  h1: {
    fontSize: 36,
    fontWeight: "bold" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "bold" as const,
  },
  h3: {
    fontSize: 22,
    fontWeight: "bold" as const,
  },
  h4: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
  },
  bodySmall: {
    fontSize: 14,
  },
  caption: {
    fontSize: 13,
  },
} as const;
