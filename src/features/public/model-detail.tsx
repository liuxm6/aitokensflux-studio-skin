import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/copy-button";
import { AppLink, EmptyState, Select, StaticDataTable, DemoNotice } from "@/components/primitives";
import { models } from "@/demo/fixtures";
import { useDemoStore } from "@/demo/store";
import { formatCompactNumber, formatMoney, toIntlLocale } from "@/lib/format";
import { mergeRouteSearch, readEnum, type RouteSearch } from "@/lib/route-search";
import { ModelCard } from "./model-card";
import { ProviderLogo } from "@/components/provider-logo";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const modelTabs = ["Overview", "Providers", "API example", "Performance"] as const;

export function ModelDetail(props: { id: string }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as RouteSearch;
  const tab = readEnum(search.tab, modelTabs, "Overview");
  const language = readEnum(search.language, ["JavaScript", "Python"] as const, "JavaScript");
  const updateSearch = (patch: RouteSearch, replace = false) => {
    void navigate({
      to: "/$",
      params: { _splat: `models/${props.id}` },
      search: mergeRouteSearch(search, patch),
      replace,
    });
  };
  const changeTab = (value: string) =>
    updateSearch({ tab: value === "Overview" ? undefined : value });
  const changeLanguage = (value: string) =>
    updateSearch({ language: value === "JavaScript" ? undefined : value }, true);
  const [tokens, setTokens] = useState("100000");
  const tokenCount = Number(tokens);
  const validTokens =
    tokens.trim() !== "" &&
    Number.isSafeInteger(tokenCount) &&
    tokenCount >= 0 &&
    tokenCount <= 1000000;
  const favorites = useDemoStore((state) => state.favorites);
  const toggle = useDemoStore((state) => state.toggleFavorite);
  const model = models.find((item) => item.id === props.id);
  const locale = toIntlLocale(i18n.language);
  if (!model)
    return (
      <div className="container-wide public-page model-detail-page">
        <EmptyState
          headingLevel={1}
          title="Model not found"
          description="This model is not in the demo catalog."
          action={<AppLink to="/models">{t("Back to models")}</AppLink>}
        />
      </div>
    );
  const code =
    language === "JavaScript"
      ? `const response = await client.chat.completions.create({\n  model: '${model.id}',\n  messages: [{ role: 'user', content: 'Hello!' }]\n});`
      : `response = client.chat.completions.create(\n    model="${model.id}",\n    messages=[{"role": "user", "content": "Hello!"}]\n)`;
  return (
    <div className="container-wide public-page model-detail-page">
      <AppLink to="/models" className="text-link mb-8">
        <ArrowLeft size={15} aria-hidden="true" />
        {t("Back to models")}
      </AppLink>
      <div className="page-heading">
        <div className="flex items-center gap-5">
          <span className={`provider-mark ${model.tone} !w-16 !h-16 !text-3xl`} aria-hidden="true">
            <ProviderLogo provider={model.provider} fallback={model.monogram} />
          </span>
          <div>
            <h1>{model.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground text-xs mt-2">
              <span>{model.id}</span>
              <CopyButton
                value={model.id}
                aria-label={t("Copy model ID")}
                className="icon-button"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => toggle(model.id)}
            aria-pressed={favorites.includes(model.id)}
          >
            <Star size={16} aria-hidden="true" />
            {t("Favorite")}
          </Button>
          <Button render={<AppLink to="/console/keys" />} nativeButton={false}>
            {t("Get an API key")}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground max-w-2xl mb-8 text-base">{t(model.description)}</p>
      <div className="stats-row model-stats">
        <div className="stat">
          <span className="stat-label">{t("Context window")}</span>
          <strong className="stat-value">{formatCompactNumber(model.context, locale)}</strong>
          <span className="stat-note">{t("tokens")}</span>
        </div>
        <div className="stat">
          <span className="stat-label">{t("Input price")}</span>
          <strong className="stat-value">{formatMoney(model.input, locale)}</strong>
          <span className="stat-note">{t("per million tokens")}</span>
        </div>
        <div className="stat">
          <span className="stat-label">{t("Output price")}</span>
          <strong className="stat-value">{formatMoney(model.output, locale)}</strong>
          <span className="stat-note">{t("per million tokens")}</span>
        </div>
      </div>
      <Tabs value={tab} onValueChange={(value) => changeTab(String(value))} className="gap-0">
        <TabsList
          variant="line"
          className="tab-list !h-auto !w-full !justify-start !gap-6 !p-0"
          aria-label={t("Model details")}
        >
          {modelTabs.map((option) => (
            <TabsTrigger
              key={option}
              value={option}
              className="!min-h-11 !flex-none !px-0 !py-3 after:!hidden data-active:!border-b-primary data-active:!text-primary !rounded-none !border-b-2 !border-transparent"
            >
              {t(option)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="Overview">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="panel">
              <h2 className="!text-lg mb-5">{t("Built for your workflow")}</h2>
              {[
                "OpenAI-compatible API",
                "Streaming responses",
                "Structured outputs",
                "Tool calling",
              ].map((label) => (
                <div
                  key={label}
                  className="flex gap-3 items-center py-3 border-b border-border last:border-0"
                >
                  <CheckCircle2 size={17} className="text-success" aria-hidden="true" />
                  {t(label)}
                </div>
              ))}
            </div>
            <div className="panel">
              <h2 className="!text-lg mb-3">{t("Estimate a sample request")}</h2>
              <p className="text-xs text-muted-foreground mb-5">
                {t("Illustrative input cost only. No request is sent.")}
              </p>
              <label className="block mb-2 text-sm" htmlFor="sample-tokens">
                {t("Input tokens")}
              </label>
              <Input
                id="sample-tokens"
                name="sample-tokens"
                type="number"
                autoComplete="off"
                spellCheck={false}
                min={0}
                max={1000000}
                step={1}
                inputMode="numeric"
                value={tokens}
                onChange={(event) => setTokens(event.target.value)}
                aria-invalid={!validTokens || undefined}
                aria-describedby={!validTokens ? "sample-tokens-error" : undefined}
              />
              {!validTokens && (
                <p id="sample-tokens-error" className="field-error" role="alert">
                  {t("Enter a whole number of tokens from 0 to 1,000,000.")}
                </p>
              )}
              <output
                htmlFor="sample-tokens"
                aria-label={t("Estimated input cost")}
                aria-live="polite"
                className="stat-value !mt-6"
              >
                {validTokens ? formatMoney((tokenCount / 1000000) * model.input, locale) : "—"}
              </output>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="Providers">
          <StaticDataTable
            label="Model providers"
            data={[{ id: "provider", name: model.provider }]}
            columns={[
              { id: "name", label: "Provider", cell: (row) => row.name },
              {
                id: "context",
                label: "Context",
                cell: () => formatCompactNumber(model.context, locale),
              },
              {
                id: "input",
                label: "Input / 1M tokens",
                cell: () => formatMoney(model.input, locale),
              },
              { id: "status", label: "Availability", cell: () => t("Demo data") },
            ]}
          />
        </TabsContent>
        <TabsContent value="API example">
          <div className="panel">
            <div className="flex items-center justify-between mb-5">
              <Select
                label="Code language"
                value={language}
                onChange={changeLanguage}
                options={["JavaScript", "Python"].map((value) => ({ value, label: value }))}
              />
              <CopyButton value={code} tooltip={t("Copy code")} />
            </div>
            <pre className="code-block">{code}</pre>
            <p className="text-xs text-muted-foreground mt-4">
              {t("Use your own API key only after live integration is implemented.")}
            </p>
          </div>
        </TabsContent>
        <TabsContent value="Performance">
          <div className="panel">
            <h2 className="!text-lg mb-2">{t("Performance preview")}</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {t("Example response times, not a live service measurement.")}
            </p>
            <div className="flex items-end gap-3">
              <strong className="text-4xl font-medium">{model.latency}</strong>
              <span className="text-muted-foreground mb-1">ms / {t("First token")}</span>
            </div>
            <div
              className="progress-track mt-6"
              role="meter"
              aria-valuenow={model.latency}
              aria-valuemin={0}
              aria-valuemax={1000}
              aria-label={t("Example latency")}
            >
              <span style={{ width: `${model.latency / 10}%` }} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <div className="mt-6">
        <DemoNotice>
          {t("Model details and prices shown here are demo examples, not current quotations.")}
        </DemoNotice>
      </div>
      <section className="section">
        <h2 className="mb-6">{t("Keep exploring")}</h2>
        <div className="model-grid">
          {models
            .filter((item) => item.id !== model.id)
            .slice(0, 3)
            .map((item) => (
              <ModelCard key={item.id} model={item} />
            ))}
        </div>
      </section>
    </div>
  );
}
