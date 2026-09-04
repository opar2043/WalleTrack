import { CACHE_KEYS, getItem, setItem } from "@services/storage";
import type { ExchangeRate } from "@t/index";
import { EXCHANGE_RATE_API_KEY } from "@env";

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const API_URL = "https://open.er-api.com/v6/latest";

export async function getExchangeRates(
  baseCurrency: string = "USD"
): Promise<Record<string, number> | null> {
  const cached = getItem<ExchangeRate>(`${CACHE_KEYS.EXCHANGE_RATES}_${baseCurrency}`);

  if (
    cached &&
    Date.now() - cached.updatedAt < CACHE_DURATION_MS &&
    Object.keys(cached.rates).length > 0
  ) {
    return cached.rates;
  }

  try {
    const url = `${API_URL}/${baseCurrency}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.rates) return null;

    const rates: ExchangeRate = {
      base: baseCurrency,
      rates: data.rates,
      updatedAt: Date.now(),
    };

    setItem(`${CACHE_KEYS.EXCHANGE_RATES}_${baseCurrency}`, rates);
    return rates.rates;
  } catch (error) {
    console.error("Exchange rate fetch error:", error);
    return cached?.rates ?? null;
  }
}

export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) return amount;

  const rates = await getExchangeRates(fromCurrency);
  if (!rates || !rates[toCurrency]) {
    return amount;
  }

  return amount * rates[toCurrency];
}

export async function convertToBase(
  amount: number,
  fromCurrency: string,
  baseCurrency: string
): Promise<number> {
  return convertCurrency(amount, fromCurrency, baseCurrency);
}
