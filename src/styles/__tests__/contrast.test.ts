import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(resolve("src/styles/index.css"), "utf8");
const lightBlock = stylesheet.match(/:root\s*\{([^}]+)\}/)?.[1] ?? "";
const darkBlock = stylesheet.match(/\.dark\s*\{([^}]+)\}/)?.[1] ?? "";
const homeLightBlock = stylesheet.match(/\.home-page, \.home-topbar\s*\{([^}]+)\}/)?.[1] ?? "";
const homeDarkBlock =
  stylesheet.match(/\.dark \.home-page, \.dark \.home-topbar\s*\{([^}]+)\}/)?.[1] ?? "";
const pairs = [
  ["foreground", "background"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["success", "success-bg"],
  ["destructive", "card"],
] as const;

function contrast(foreground: string, background: string): number {
  const luminance = (color: string) => {
    const linear = [1, 3, 5].map((index) => {
      const channel = Number.parseInt(color.slice(index, index + 2), 16) / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  };
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

for (const [theme, block] of [
  ["light", lightBlock],
  ["dark", `${lightBlock}${darkBlock}`],
  ["home light", `${lightBlock}${homeLightBlock}`],
  ["home dark", `${lightBlock}${darkBlock}${homeDarkBlock}`],
]) {
  const tokens = Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[\da-f]{6})/gi)].map((match) => [match[1], match[2]]),
  );
  describe(`${theme} theme readability`, () => {
    it.each(pairs)("%s on %s keeps normal text at WCAG AA contrast", (ink, surface) => {
      expect(tokens[ink]).toMatch(/^#[\da-f]{6}$/i);
      expect(tokens[surface]).toMatch(/^#[\da-f]{6}$/i);
      expect(contrast(tokens[ink], tokens[surface])).toBeGreaterThanOrEqual(4.5);
    });
    it("focus indication remains distinguishable from the page", () => {
      expect(contrast(tokens.ring, tokens.background)).toBeGreaterThanOrEqual(3);
    });
    if (theme.startsWith("home")) {
      it("the large accent heading keeps large-text AA contrast", () => {
        expect(contrast(tokens["hero-accent"], tokens.background)).toBeGreaterThanOrEqual(3);
      });
    }
  });
}
