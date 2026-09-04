import { colors, typography } from "@theme/index";

export function formatCurrency(
  amount: number,
  currencyCode: string = "USD",
  showSymbol: boolean = true
): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${showSymbol ? "" : ""}${amount.toFixed(2)} ${currencyCode}`;
  }
}

export function formatCompactCurrency(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount.toFixed(0)}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatMonthYear(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function getMonthName(month: number, short = true): string {
  const names = short
    ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return names[month] || "";
}

export function getDayName(day: number, short = true): string {
  const names = short
    ? ["S", "M", "T", "W", "T", "F", "S"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return names[day] || "";
}

export function getFullDayName(day: number): string {
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return names[day] || "";
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getStartOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getEndOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
}

export function getStartOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getStartOfYear(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), 0, 1);
}

export function getLastNDays(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function isInDateRange(date: Date | string, start: Date, end: Date): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return d >= start && d <= end;
}

export function addMonths(date: Date | string, months: number): Date {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function getRelativeTimeSpent(now: Date, startOfMonth: Date): number {
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  return dayOfMonth / daysInMonth;
}

export function getChartTheme(
  isDark: boolean
): {
  textColor: string;
  axisColor: string;
  gridColor: string;
  barColor: string;
  pieColors: string[];
} {
  return {
    textColor: isDark ? "#E5E7EB" : "#6B7280",
    axisColor: isDark ? "#374151" : "#E5E7EB",
    gridColor: isDark ? "#2A2A3C" : "#E5E7EB",
    barColor: colors.primary,
    pieColors: [
      colors.chartNavy,
      colors.chartOrange,
      colors.chartViolet,
      colors.chartGray,
    ],
  };
}

export const getTypography = () => typography;
