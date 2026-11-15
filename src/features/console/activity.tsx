import { useState } from "react";
import { useNavigate, useRouterState, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Download, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/dialog";
import { CopyButton } from "@/components/copy-button";
import { PageHeading, Select, StaticDataTable, Status, Pagination } from "@/components/primitives";
import {
  DEMO_PERIOD_END,
  getDemoRequests,
  summarizeDemoRequests,
  type DemoRequest,
} from "@/demo/scope-data";
import { formatDate, formatMoney, formatNumber, toIntlLocale } from "@/lib/format";
import { mergeRouteSearch, readEnum, readPositivePage, type RouteSearch } from "@/lib/route-search";
import { UsageChart } from "./usage-chart";

export function ActivityPage(props: { logs?: boolean; audit?: boolean; scope?: string }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const search = useSearch({ strict: false }) as RouteSearch;
  const query = search.q ?? "";
  const status = readEnum(search.status, ["all", "Completed", "Budget limit"] as const, "all");
  const range = readEnum(search.range, ["7", "30"] as const, "7");
  const page = readPositivePage(search.page);
  const [detail, setDetail] = useState<DemoRequest | null>(null);
  const locale = toIntlLocale(i18n.language);
  const updateSearch = (patch: Partial<RouteSearch>, replace = true) => {
    const nextPatch = "page" in patch ? patch : { ...patch, page: undefined };
    void navigate({
      to: "/$",
      params: { _splat: path.slice(1) },
      search: mergeRouteSearch(search, nextPatch),
      replace,
    });
  };
  const setQuery = (value: string) => updateSearch({ q: value || undefined });
  const setRange = (value: string) => updateSearch({ range: value === "7" ? undefined : value });
  const setStatus = (value: string) =>
    updateSearch({ status: value === "all" ? undefined : value });
  const setPage = (value: number) => updateSearch({ page: value > 1 ? String(value) : undefined });
  let title = "Your activity, at a glance";
  if (props.logs) title = "Every request has a story";
  if (props.audit) title = "A clear trail of changes";
  const filtered = getDemoRequests(props.scope ?? "personal", range).filter(
    (request) =>
      `${request.model} ${request.key} ${request.id}`.toLowerCase().includes(query.toLowerCase()) &&
      (status === "all" || request.status === status),
  );
  const filteredAudit = [
    {
      id: "a1",
      actor: "Alex Morgan",
      action: "Created API key",
      target: "Production API",
      date: "2026-11-14",
    },
    {
      id: "a2",
      actor: "Lin Chen",
      action: "Updated workspace budget",
      target: "Production",
      date: "2026-11-13",
    },
    {
      id: "a3",
      actor: "Alex Morgan",
      action: "Invited a member",
      target: "jamie@example.test",
      date: "2026-11-12",
    },
  ].filter(
    (item) =>
      `${t(item.action)} ${item.action} ${item.actor} ${item.target}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (range === "30" || item.date >= "2026-11-08"),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 5));
  const currentPage = Math.min(page, pages);
  const exportCsv = () => {
    const lines = props.audit
      ? [
          "id,actor,action,target,date",
          ...filteredAudit.map((row) =>
            [row.id, row.actor, row.action, row.target, row.date].join(","),
          ),
        ]
      : [
          "id,model,tokens,cost,status",
          ...filtered.map((row) => [row.id, row.model, row.tokens, row.cost, row.status].join(",")),
        ];
    const url = URL.createObjectURL(
      new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "aitokensflux-demo-activity.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("Demo CSV exported"));
  };
  return (
    <>
      <PageHeading
        title={title}
        description="Understand what happened, without losing the bigger picture."
        action={
          <Button variant="outline" onClick={exportCsv}>
            <Download size={16} aria-hidden="true" />
            {t("Export CSV")}
          </Button>
        }
      />
      <p className="mb-4 text-xs text-muted-foreground">
        {t("Sample period ending {{date}}", { date: formatDate(DEMO_PERIOD_END, locale) })}
      </p>
      <div className="toolbar">
        <div className="search-field">
          <Search aria-hidden="true" />
          <Input
            aria-label={t(props.audit ? "Audit trail" : "Search requests")}
            placeholder={t(props.audit ? "Search by name…" : "Search by model, key or request ID…")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Select
          label="Date range"
          value={range}
          onChange={setRange}
          options={[
            { value: "7", label: "Last 7 days" },
            { value: "30", label: "Last 30 days" },
          ]}
        />
        {!props.audit && (
          <Select
            label="Request status"
            value={status}
            onChange={setStatus}
            options={["all", "Completed", "Budget limit"].map((value) => ({
              value,
              label: value === "all" ? "All statuses" : value,
            }))}
          />
        )}
        <Button
          variant="outline"
          className="icon-button"
          aria-label={t("Refresh demo data")}
          onClick={() => toast.success(t("Demo data is up to date"))}
        >
          <RefreshCw size={16} aria-hidden="true" />
        </Button>
      </div>
      {!props.logs && !props.audit && (
        <div className="mb-6">
          <UsageChart data={summarizeDemoRequests(filtered, range)} />
        </div>
      )}
      {props.audit ? (
        <StaticDataTable
          label="Audit trail"
          data={filteredAudit}
          columns={[
            { id: "actor", label: "Actor", cell: (row) => row.actor },
            { id: "action", label: "Action", cell: (row) => t(row.action) },
            { id: "target", label: "Target", cell: (row) => row.target },
            { id: "date", label: "Date", cell: (row) => formatDate(row.date, locale) },
          ]}
        />
      ) : (
        <>
          <StaticDataTable
            label="Request logs"
            data={filtered.slice((currentPage - 1) * 5, currentPage * 5)}
            columns={[
              {
                id: "id",
                label: "Request",
                cell: (row) => (
                  <Button variant="link" className="!px-0 !text-xs" onClick={() => setDetail(row)}>
                    {row.id}
                  </Button>
                ),
              },
              { id: "model", label: "Model", cell: (row) => row.model },
              { id: "tokens", label: "Tokens", cell: (row) => formatNumber(row.tokens, locale) },
              { id: "cost", label: "Cost", cell: (row) => formatMoney(row.cost, locale) },
              { id: "status", label: "Status", cell: (row) => <Status value={row.status} /> },
              { id: "date", label: "Date", cell: (row) => formatDate(row.date, locale) },
            ]}
          />
          <Pagination page={currentPage} pages={pages} onChange={setPage} />
        </>
      )}
      {detail && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setDetail(null);
          }}
          title={t("Request details")}
          description={detail.id}
          contentClassName="sm:max-w-lg"
        >
          <dl className="grid grid-cols-2 gap-5">
            {[
              [t("Model"), detail.model],
              [t("API key"), detail.key],
              [t("Tokens"), formatNumber(detail.tokens, locale)],
              [t("Cost"), formatMoney(detail.cost, locale)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex items-center justify-between mt-6">
            <Status value={detail.status} />
            <CopyButton value={detail.id} aria-label={t("Copy request ID")} />
          </div>
          {detail.status === "Budget limit" && (
            <p className="mt-5 rounded-lg bg-muted p-4 text-sm">
              {t("This example request was blocked by a budget rule. No charge was made.")}
            </p>
          )}
        </Dialog>
      )}
    </>
  );
}
