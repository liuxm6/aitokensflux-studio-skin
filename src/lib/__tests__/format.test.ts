import { describe, it, expect } from "vitest";
import { toIntlLocale, formatMoney, formatNumber } from "../format";

describe("Localized display values", () => {
  it.each(["zh", "zh-CN", "zhCN", "zh-TW", "zhTW", "en", "ru", "fr", "ja", "vi"])(
    "formats %s through a valid Intl locale",
    (language) => {
      const locale = toIntlLocale(language);
      expect(() => formatNumber(1234.5, locale)).not.toThrow();
      expect(() => formatMoney(0.0123, locale)).not.toThrow();
    },
  );
  it("falls back safely for an invalid language code", () => {
    expect(toIntlLocale("not_a_locale")).toBeUndefined();
    expect(() => formatNumber(10, toIntlLocale("not_a_locale"))).not.toThrow();
  });
  it("retains fine precision for small demo prices", () => {
    expect(formatMoney(0.0123, "en")).toBe("$0.0123");
    expect(formatMoney(1200, "en")).toBe("$1,200.00");
    expect(formatNumber(1234.5, "ru")).toContain(",5");
  });
});
