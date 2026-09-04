export function generateId(prefix = ""): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${random}`;
}

export function maskCardNumber(cardNumber: string): string {
  if (cardNumber.length < 8) return `•••• ${cardNumber}`;
  const first4 = cardNumber.slice(0, 4);
  const last4 = cardNumber.slice(-4);
  return `${first4} •••• •••• ${last4}`;
}

export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export function debounce<F extends (...args: never[]) => void>(
  func: F,
  wait: number
): (...args: Parameters<F>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function truncateString(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function parseAmount(str: string): number {
  return parseFloat(str.replace(/[^0-9.]/g, "")) || 0;
}

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
