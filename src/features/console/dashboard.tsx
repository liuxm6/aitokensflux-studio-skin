import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowUpRight,
  Wallet,
  Activity,
  KeyRound,
  CircleDollarSign,
  BookOpen,
  Users,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageHeading,
  Select,
  AppLink,
  StaticDataTable,
  Status,
  TextLink,
} from "@/components/primitives";
import { useDemoStore } from "@/demo/store";
import {
  DEMO_PERIOD_END,
  getDemoRequests,
  matchesDemoScope,
  summarizeDemoRequests,
} from "@/demo/scope-data";
import { getContext } from "@/demo/navigation";
import { formatDate, formatMoney, formatNumber, toIntlLocale } from "@/lib/format";
import { UsageChart } from "./usage-chart";

export function Dashboard(props: { base: string; org: boolean; workspace: boolean }) {
  const { t, i18n } = useTranslation();
  const [range, setRange] = useState("7");
  const balance = useDemoStore((state) => (props.org ? state.organizationBalance : state.balance));
  const profileName = useDemoStore((state) => state.profileName);
  const keys = useDemoStore((state) => state.keys);
  const workspaces = useDemoStore((state) => state.workspaces);
  const locale = toIntlLocale(i18n.language);
  const scope = getContext(props.base).scope;
  const scopedRequests = getDemoRequests(scope, range);
  const data = summarizeDemoRequests(scopedRequests, range);
  const scopedKeys = keys.filter((key) => matchesDemoScope(key.scope, scope));
  let title = "A good day to build, {{name}}.";
  if (props.org) title = "Your team, in sync.";
  if (props.workspace) title = "A little clarity for your workspace.";
  const keysPath = props.workspace || !props.org ? `${props.base}/keys` : `${props.base}/members`;
  const keyLabel = props.org && !props.workspace ? "Manage members" : "Manage API keys";
  return (
    <>
      <PageHeading
        title={title}
        titleValues={{ name: profileName.trim().split(/\s+/)[0] || profileName }}
        description="Everything you need to keep your next idea moving."
        action={
          <Button render={<AppLink to={keysPath} />} nativeButton={false}>
            <Plus size={16} aria-hidden="true" />
            {t(keyLabel)}
          </Button>
        }
      />
      <div className="mb-5 flex justify-between items-center gap-3">
        <span className="text-sm font-medium">{t("Workspace overview")}</span>
        <Select
          label="Date range"
          value={range}
          onChange={setRange}
          options={[
            { value: "7", label: "Last 7 days" },
            { value: "30", label: "Last 30 days" },
          ]}
        />
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        {t("Sample period ending {{date}}", { date: formatDate(DEMO_PERIOD_END, locale) })}
      </p>
      <div className="stats-row">
        {[
          {
            label: props.org ? "Shared organization credits" : "Available credits",
            value: formatMoney(balance, locale),
            icon: Wallet,
            note: "Ready for your next request",
          },
          {
            label: "Spend this period",
            value: formatMoney(
              data.reduce((sum, row) => sum + row.value, 0),
              locale,
            ),
            icon: CircleDollarSign,
            note: "Demo usage",
          },
          {
            label: "Requests",
            value: formatNumber(
              data.reduce((sum, row) => sum + row.requests, 0),
              locale,
            ),
            icon: Activity,
            note: "Across your selected period",
          },
          {
            label: "Active keys",
            value: formatNumber(scopedKeys.filter((key) => key.active).length, locale),
            icon: KeyRound,
            note: "Secure access to your models",
          },
        ].map((stat) => (
          <div className="stat" key={stat.label} role="group" aria-label={t(stat.label)}>
            <span className="stat-label">
              <stat.icon aria-hidden="true" />
              {t(stat.label)}
            </span>
            <strong className="stat-value">{stat.value}</strong>
            <span className="stat-note">{t(stat.note)}</span>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <UsageChart data={data} />
        <aside className="panel dashboard-actions">
          <div className="panel-title">
            <h2>{t("Make it yours")}</h2>
          </div>
          {[
            {
              path: keysPath,
              icon: KeyRound,
              title: keyLabel,
              subtitle: "Keep access under control",
            },
            {
              path: "/docs",
              icon: BookOpen,
              title: "Make your first request",
              subtitle: "A few lines to get started",
            },
            {
              path: "/o",
              icon: Users,
              title: "Build with your team",
              subtitle: "Shared spaces, clear boundaries",
            },
          ].map((item) => (
            <AppLink key={item.path} to={item.path} className="quick-action">
              <span className="feature-icon">
                <item.icon aria-hidden="true" />
              </span>
              <span className="text-[13px]">
                {t(item.title)}
                <small>{t(item.subtitle)}</small>
              </span>
              <ArrowUpRight
                size={14}
                className="ml-auto text-muted-foreground"
                aria-hidden="true"
              />
            </AppLink>
          ))}
        </aside>
      </div>
      {props.org && !props.workspace && (
        <section className="mb-7">
          <div className="section-heading">
            <h2 className="!text-lg">{t("Your workspaces")}</h2>
            <TextLink to={`${props.base}/settings`}>{t("Manage organization")}</TextLink>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {workspaces.map((workspace) => (
              <AppLink
                key={workspace.id}
                to={`${props.base}/w/${workspace.id}/console`}
                className="panel flex items-center justify-between gap-3"
              >
                <div>
                  <h3>{workspace.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    {workspace.id === "default" ? t("Default workspace") : t("Team workspace")}
                  </span>
                </div>
                <Status value={workspace.paused ? "Paused" : "Active"} />
                <ArrowUpRight size={18} aria-hidden="true" />
              </AppLink>
            ))}
          </div>
        </section>
      )}
      <section>
        <div className="section-heading">
          <div>
            <h2 className="!text-lg">{t("Recent requests")}</h2>
            <p className="!text-xs">{t("A snapshot of your latest activity.")}</p>
          </div>
          <TextLink
            to={
              props.org
                ? `${props.base}/${props.workspace ? "usage" : "activity"}`
                : "/console/logs"
            }
          >
            {t("View all activity")}
          </TextLink>
        </div>
        <StaticDataTable
          label="Recent requests"
          data={scopedRequests.slice(0, 4)}
          columns={[
            {
              id: "model",
              label: "Model",
              cell: (row) => <strong className="!font-medium">{row.model}</strong>,
            },
            {
              id: "key",
              label: "API key",
              cell: (row) => <span className="text-muted-foreground">{row.key}</span>,
            },
            { id: "tokens", label: "Tokens", cell: (row) => formatNumber(row.tokens, locale) },
            { id: "cost", label: "Cost", cell: (row) => formatMoney(row.cost, locale) },
            { id: "status", label: "Status", cell: (row) => <Status value={row.status} /> },
          ]}
        />
      </section>
    </>
  );
}
