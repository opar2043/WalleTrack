import { DEMO_USD_RATES } from "../../data";
import { CACHE_KEYS, getItem, setItem } from "@services/storage";
import type { ExchangeRate } from "@t/index";

// Static demo rates – no network calls. When you wire up the real backend,
// replace this implementation with a live exchange-rate API.
const BASE_RATES: Record<string, number> = DEMO_USD_RATES;

export async function getExchangeRates(
  baseCurrency: string = "USD"
): Promise<Record<string, number> | null> {
  const cached = getItem<ExchangeRate>(`${CACHE_KEYS.EXCHANGE_RATES}_${baseCurrency}`);

  const base = baseCurrency.toUpperCase();
  const baseValue = BASE_RATES[base] ?? 1;

  const rates: Record<string, number> = {};
  Object.keys(BASE_RATES).forEach((code) => {
    rates[code] = BASE_RATES[code] / baseValue;
  });

  const rate: ExchangeRate = {
    base: base,
    rates,
    updatedAt: Date.now(),
  };

  setItem(`${CACHE_KEYS.EXCHANGE_RATES}_${base}`, rate);
  return cached?.rates ?? rates;
}

export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) return amount;

  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  const fromPerUsd = BASE_RATES[from];
  const toPerUsd = BASE_RATES[to];

  if (fromPerUsd == null || toPerUsd == null) {
    return amount;
  }

  // amount(from) -> USD -> amount(to)
  const usd = amount / fromPerUsd;
  return usd * toPerUsd;
}

export async function convertToBase(
  amount: number,
  fromCurrency: string,
  baseCurrency: string
): Promise<number> {
  return convertCurrency(amount, fromCurrency, baseCurrency);
}