import { requests } from "./fixtures";

export const DEMO_PERIOD_END = "2026-11-14";
export type DemoRequest = (typeof requests)[number] & { scope: string };
const scopedRequests: DemoRequest[] = [
  ...requests.map((request) => ({ ...request, scope: "personal" })),
  {
    id: "req_personal_older",
    scope: "personal",
    model: "GPT-4.1",
    key: "Local development",
    tokens: 1840,
    cost: 0.012,
    status: "Completed",
    date: "2026-11-04T11:00:00Z",
  },
  {
    id: "req_org_101",
    scope: "studio/default",
    model: "GPT-4.1",
    key: "Website assistant",
    tokens: 3200,
    cost: 0.024,
    status: "Completed",
    date: "2026-11-14T10:10:00Z",
  },
  {
    id: "req_org_102",
    scope: "studio/default",
    model: "Gemini Pro",
    key: "Website assistant",
    tokens: 9000,
    cost: 0.05,
    status: "Completed",
    date: "2026-11-13T09:20:00Z",
  },
  {
    id: "req_org_103",
    scope: "studio/default",
    model: "Claude Sonnet",
    key: "Website assistant",
    tokens: 2500,
    cost: 0.025,
    status: "Completed",
    date: "2026-11-10T14:20:00Z",
  },
  {
    id: "req_org_104",
    scope: "studio/default",
    model: "GPT-4.1",
    key: "Website assistant",
    tokens: 0,
    cost: 0,
    status: "Budget limit",
    date: "2026-11-05T08:15:00Z",
  },
  {
    id: "req_research_101",
    scope: "studio/research",
    model: "DeepSeek R1",
    key: "Design experiments",
    tokens: 4800,
    cost: 0.0105,
    status: "Completed",
    date: "2026-11-14T08:30:00Z",
  },
  {
    id: "req_research_102",
    scope: "studio/research",
    model: "Qwen Coder",
    key: "Design experiments",
    tokens: 1300,
    cost: 0.0018,
    status: "Completed",
    date: "2026-11-09T12:40:00Z",
  },
];

export function matchesDemoScope(value: string, scope: string): boolean {
  return scope === "studio" ? value.startsWith("studio/") : value === scope;
}

export function demoPeriodDays(range: string): string[] {
  const count = range === "30" ? 30 : 7;
  return Array.from({ length: count }, (_, index) =>
    new Date(Date.UTC(2026, 10, 14 - count + 1 + index)).toISOString().slice(0, 10),
  );
}

export function getDemoRequests(scope: string, range: string): DemoRequest[] {
  const firstDay = demoPeriodDays(range)[0];
  return scopedRequests
    .filter((request) => matchesDemoScope(request.scope, scope) && request.date >= firstDay)
    .sort((a, b) => b.date.localeCompare(a.date));
}

// Aggregates only the deterministic rows displayed by the preview, never upstream usage.
export function summarizeDemoRequests(rows: DemoRequest[], range: string) {
  const daily = new Map(demoPeriodDays(range).map((day) => [day, { day, value: 0, requests: 0 }]));
  for (const row of rows) {
    const bucket = daily.get(row.date.slice(0, 10));
    if (bucket) {
      bucket.value += row.cost;
      bucket.requests += 1;
    }
  }
  return [...daily.values()];
}
