import { z } from "zod";

const searchString = z.union([z.string(), z.number()]).transform(String).optional();

export const routeSearchSchema = z.object({
  q: searchString,
  provider: searchString,
  category: searchString,
  tab: searchString,
  language: searchString,
  view: searchString,
  sort: searchString,
  context: searchString,
  modality: searchString,
  favorites: searchString,
  page: searchString,
  status: searchString,
  range: searchString,
  section: searchString,
});

export type RouteSearch = z.infer<typeof routeSearchSchema>;

export function mergeRouteSearch(current: RouteSearch, patch: Partial<RouteSearch>): RouteSearch {
  const next = { ...current, ...patch };
  for (const [key, value] of Object.entries(next)) {
    if (value === undefined || value === "") delete next[key as keyof RouteSearch];
  }
  return next;
}

export function readPositivePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function readEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}
