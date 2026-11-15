import { describe, expect, it } from "vitest";
import { demoPeriodDays, getDemoRequests, summarizeDemoRequests } from "../scope-data";

describe("Scoped demo activity", () => {
  it("organization activity is the union of its workspaces, never personal requests", () => {
    const org = getDemoRequests("studio", "7");
    expect(org).toHaveLength(5);
    expect(org.every((row) => row.scope.startsWith("studio/"))).toBe(true);
    expect(getDemoRequests("studio/default", "7")).toHaveLength(3);
    expect(getDemoRequests("studio/research", "7")).toHaveLength(2);
  });
  it("a longer sample range includes older requests", () => {
    expect(getDemoRequests("personal", "7")).toHaveLength(8);
    expect(getDemoRequests("personal", "30")).toHaveLength(9);
    expect(demoPeriodDays("7")[0]).toBe("2026-11-08");
  });
  it("chart totals follow the same filtered rows as the request table", () => {
    const rows = getDemoRequests("studio/default", "7").filter((row) => row.model === "GPT-4.1");
    const chart = summarizeDemoRequests(rows, "7");
    expect(chart.reduce((total, day) => total + day.requests, 0)).toBe(1);
    expect(chart.reduce((total, day) => total + day.value, 0)).toBeCloseTo(0.024);
    expect(
      summarizeDemoRequests([], "7").every((day) => day.value === 0 && day.requests === 0),
    ).toBe(true);
  });
});
