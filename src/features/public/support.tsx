import { useState } from "react";
import { useNavigate, useRouterState, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Search,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  BookOpen,
  Terminal,
  KeyRound,
  Layers3,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/copy-button";
import {
  AppLink,
  PageHeading,
  Select,
  StaticDataTable,
  Status,
  DemoNotice,
  EmptyState,
} from "@/components/primitives";
import { models } from "@/demo/fixtures";
import { ProviderLogo } from "@/components/provider-logo";
import { formatNumber, toIntlLocale } from "@/lib/format";
import { mergeRouteSearch, readEnum, type RouteSearch } from "@/lib/route-search";

export function ProvidersPage() {
  const { t } = useTranslation();
  const search = useSearch({ strict: false }) as { q?: string };
  const navigate = useNavigate();
  const query = search.q ?? "";
  const normalizedQuery = query.trim().normalize("NFKC").toLowerCase();
  const setQuery = (q: string) => {
    void navigate({
      to: "/$",
      params: { _splat: "providers" },
      search: q ? { q } : {},
      replace: true,
    });
  };
  const providers = [...new Set(models.map((model) => model.provider))].filter((name) =>
    name.normalize("NFKC").toLowerCase().includes(normalizedQuery),
  );
  return (
    <div className="container-wide public-page">
      <PageHeading
        title="Great minds. One connection."
        description="Explore the people and platforms behind your favorite models."
      />
      <div className="toolbar max-w-lg">
        <div className="search-field">
          <Search aria-hidden="true" />
          <Input
            aria-label={t("Search providers")}
            placeholder={t("Search providers…")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>
      <div className="model-grid">
        {providers.map((name) => {
          const examples = models.filter((model) => model.provider === name);
          return (
            <article className="model-card" key={name}>
              <span className={`provider-mark ${examples[0].tone}`} aria-hidden="true">
                <ProviderLogo provider={name} fallback={examples[0].monogram} />
              </span>
              <h3 translate="no">{name}</h3>
              <p>{examples.map((model) => model.name).join(", ")}</p>
              <AppLink to="/models" search={{ provider: name }} className="text-link mt-5">
                {t("Explore models")}
                <ArrowUpRight size={15} aria-hidden="true" />
              </AppLink>
            </article>
          );
        })}
      </div>
      {!providers.length && (
        <EmptyState
          title="No matching providers"
          description="Try another provider name."
          action={
            <Button variant="outline" onClick={() => setQuery("")}>
              {t("Clear search")}
            </Button>
          }
        />
      )}
    </div>
  );
}

export function StatusPage() {
  const { t } = useTranslation();
  return (
    <div className="container-wide public-page">
      <PageHeading
        title="A calm view of your services."
        description="An example status page. No live monitoring connection is active."
        action={
          <Button
            variant="outline"
            onClick={() =>
              toast.success(t("Sample status refreshed. No live service was checked."))
            }
          >
            <RefreshCw size={16} aria-hidden="true" />
            {t("Refresh preview")}
          </Button>
        }
      />
      <div className="panel flex items-center gap-4 mb-7">
        <CheckCircle2 className="text-success" size={30} aria-hidden="true" />
        <div>
          <h2 className="!text-lg">{t("All demo systems operational")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("Illustrative availability, not a service-level guarantee.")}
          </p>
        </div>
      </div>
      <div className="panel">
        {["API gateway", "Authentication", "Model routing", "Organization services"].map((name) => (
          <div className="setting-row" key={name}>
            <div>
              <h3>{t(name)}</h3>
              <p>{t("Demo monitoring group")}</p>
            </div>
            <Status value="Operational" />
          </div>
        ))}
      </div>
      <div className="mt-6">
        <DemoNotice />
      </div>
    </div>
  );
}

const docSections = [
  "Quick start",
  "Authentication",
  "Choose a model",
  "Routing and fallback",
  "Errors and limits",
  "Team workspaces",
];
const exampleCode = `curl https://api.example.test/v1/chat/completions \\\n  -H 'Authorization: Bearer DEMO_NOT_A_REAL_KEY' \\\n  -H 'Content-Type: application/json' \\\n  -d '{"model":"openai/gpt-4.1",\n       "messages":[{"role":"user","content":"Hello!"}]}'`;
export function DocsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const search = useSearch({ strict: false }) as RouteSearch;
  const section = readEnum(search.section, docSections, "Quick start");
  const setSection = (value: string) => {
    void navigate({
      to: "/$",
      params: { _splat: path.slice(1) },
      search: mergeRouteSearch(search, { section: value === "Quick start" ? undefined : value }),
      replace: false,
    });
  };
  return (
    <div className="container-wide public-page">
      <PageHeading
        title="From idea to first request."
        description="A familiar API. A short path to getting started."
      />
      <div className="settings-layout">
        <nav className="settings-nav" aria-label={t("Documentation sections")}>
          {docSections.map((item) => (
            <Button
              key={item}
              variant="ghost"
              className={`sidebar-link !justify-start !w-full ${section === item ? "active" : ""}`}
              onClick={() => setSection(item)}
              aria-pressed={section === item}
            >
              {t(item)}
            </Button>
          ))}
        </nav>
        <article className="settings-body">
          <div className="panel !p-8">
            <div className="feature-icon mb-5">
              <BookOpen aria-hidden="true" />
            </div>
            <h2>{t(section)}</h2>
            {section === "Quick start" && (
              <>
                <p className="text-muted-foreground my-5">
                  {t("Connect once and explore many models using the OpenAI-compatible API.")}
                </p>
                <div className="grid gap-5 my-7">
                  {[
                    {
                      icon: KeyRound,
                      title: "Create an API key",
                      text: "Give each project its own key and budget.",
                    },
                    {
                      icon: Layers3,
                      title: "Choose a model",
                      text: "Browse the catalog for the capabilities you need.",
                    },
                    {
                      icon: Terminal,
                      title: "Make your first request",
                      text: "Use the familiar client library or an HTTP request.",
                    },
                  ].map((step) => (
                    <div className="flex gap-4 items-start" key={step.title}>
                      <step.icon
                        size={19}
                        className="text-primary mt-1 shrink-0"
                        aria-hidden="true"
                      />
                      <div>
                        <h3 className="!text-sm">{t(step.title)}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{t(step.text)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {section === "Authentication" && (
              <p className="text-muted-foreground my-6">
                {t(
                  "Keep real keys on your server, never in browser code. This demo creates non-functional example keys only.",
                )}
              </p>
            )}
            {section === "Choose a model" && (
              <p className="text-muted-foreground my-6">
                {t(
                  "Compare input modalities, context windows and prices in the model catalog. Example specifications in this demo are not live data.",
                )}
              </p>
            )}
            {section === "Routing and fallback" && (
              <p className="text-muted-foreground my-6">
                {t(
                  "Routing preferences are shown for design review. Provider selection and fallback must be enforced by the live gateway.",
                )}
              </p>
            )}
            {section === "Errors and limits" && (
              <div className="my-6 space-y-3">
                {[
                  ["401", "Authentication required"],
                  ["403", "Access is restricted"],
                  ["429", "Rate limit reached"],
                  ["503", "Service temporarily unavailable"],
                ].map(([code, label]) => (
                  <div className="flex gap-4 py-3 border-b border-border" key={code}>
                    <code className="text-primary">{code}</code>
                    <span>{t(label)}</span>
                  </div>
                ))}
              </div>
            )}
            {section === "Team workspaces" && (
              <p className="text-muted-foreground my-6">
                {t(
                  "Organizations share billing. Workspaces organize projects. Members and keys have explicit roles and budgets.",
                )}
              </p>
            )}
            <div className="mt-6 flex justify-between items-center mb-3">
              <span className="text-xs text-muted-foreground">{t("Example request")}</span>
              <CopyButton value={exampleCode} aria-label={t("Copy example request")} />
            </div>
            <pre className="code-block">{exampleCode}</pre>
            <div className="mt-6">
              <DemoNotice>
                {t("The example URL is reserved for documentation and does not serve requests.")}
              </DemoNotice>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

export function RankingsPage() {
  const { i18n } = useTranslation();
  const [period, setPeriod] = useState("week");
  const [sort, setSort] = useState("usage");
  const locale = toIntlLocale(i18n.language);
  const multiplier = period === "month" ? 4 : 1;
  const data = models
    .map((model, index) => ({ ...model, total: (85000 - index * 7500) * multiplier }))
    .sort((a, b) => (sort === "speed" ? a.latency - b.latency : b.total - a.total));
  return (
    <div className="container-wide public-page">
      <PageHeading
        title="See what is finding its rhythm."
        description="An optional rankings concept, powered entirely by sample data."
      />
      <div className="toolbar">
        <Select
          label="Ranking period"
          value={period}
          onChange={setPeriod}
          options={[
            { value: "week", label: "This week" },
            { value: "month", label: "This month" },
          ]}
        />
        <Select
          label="Ranking metric"
          value={sort}
          onChange={setSort}
          options={[
            { value: "usage", label: "Request volume" },
            { value: "speed", label: "Lowest latency" },
          ]}
        />
      </div>
      <StaticDataTable
        label="Model rankings"
        data={data}
        columns={[
          {
            id: "model",
            label: "Model",
            cell: (row) => (
              <AppLink to={`/models/${row.id}`} className="font-medium">
                {row.name}
              </AppLink>
            ),
          },
          { id: "provider", label: "Provider", cell: (row) => row.provider },
          { id: "requests", label: "Requests", cell: (row) => formatNumber(row.total, locale) },
          { id: "latency", label: "First token", cell: (row) => `${row.latency} ms` },
        ]}
      />
      <div className="mt-6">
        <DemoNotice />
      </div>
    </div>
  );
}
