/* Adapted from new-api. Copyright (C) 2023-2026 QuantumNous.
 * AGPL-3.0-or-later; see LICENSE. Formatting is independent of production stores.
 */
export function toIntlLocale(value?: string | null): string | undefined {
  if (!value) return undefined;
  if (value === "zhCN" || value === "zh") return "zh-CN";
  if (value === "zhTW") return "zh-TW";
  try {
    return Intl.getCanonicalLocales(value)[0];
  } catch {
    return undefined;
  }
}

export function formatNumber(value: number, locale?: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}

export function formatCompactNumber(value: number, locale?: string): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

export function formatMoney(value: number, locale?: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: value !== 0 && Math.abs(value) < 1 ? 4 : 2,
  }).format(value);
}

export function formatDate(value: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
