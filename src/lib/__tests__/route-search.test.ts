import { describe, expect, it } from "vitest";
import { mergeRouteSearch, readEnum, readPositivePage } from "../route-search";

describe("route search state", () => {
  it("removes empty and undefined values for canonical links", () => {
    expect(
      mergeRouteSearch({ q: "Claude", page: "2" }, { q: "", page: undefined, tab: "Providers" }),
    ).toEqual({
      tab: "Providers",
    });
  });
  it("falls back safely for malformed page and enum values", () => {
    expect(readPositivePage("0")).toBe(1);
    expect(readPositivePage("nope")).toBe(1);
    expect(readPositivePage("3")).toBe(3);
    expect(readEnum("unknown", ["grid", "table"] as const, "grid")).toBe("grid");
    expect(readEnum("table", ["grid", "table"] as const, "grid")).toBe("table");
  });
});
