import { useState } from "react";
import { useNavigate, useRouterState, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Search, SlidersHorizontal, LayoutGrid, List, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/dialog";
import {
  PageHeading,
  Select,
  StaticDataTable,
  AppLink,
  Pagination,
  DemoNotice,
  EmptyState,
} from "@/components/primitives";
import { models } from "@/demo/fixtures";
import { useDemoStore } from "@/demo/store";
import { formatCompactNumber, formatMoney, toIntlLocale } from "@/lib/format";
import { mergeRouteSearch, readEnum, readPositivePage, type RouteSearch } from "@/lib/route-search";
import { ModelCard } from "./model-card";
import { ProviderLogo } from "@/components/provider-logo";
import { matchesModelQuery } from "./model-search";

const categories = [
  "All models",
  "General",
  "Coding",
  "Reasoning",
  "Multimodal",
  "Creative",
  "Open weights",
];
const providers = [...new Set(models.map((model) => model.provider))];

export function Catalog(props: { pricing?: boolean }) {
  const { t, i18n } = useTranslation();
  const search = useSearch({ strict: false }) as RouteSearch;
  const path = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const favorites = useDemoStore((state) => state.favorites);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const locale = toIntlLocale(i18n.language);
  const query = search.q ?? "";
  const onlyFavorites = search.favorites === "1";
  const view = readEnum(search.view, ["grid", "table"] as const, props.pricing ? "table" : "grid");
  const sort = readEnum(
    search.sort,
    ["recommended", "price", "context", "name"] as const,
    "recommended",
  );
  const context = readEnum(search.context, ["all", "200000", "1000000"] as const, "all");
  const modality = readEnum(search.modality, ["all", "Text", "Image", "Audio"] as const, "all");
  const page = readPositivePage(search.page);
  const category =
    search.category && categories.includes(search.category) ? search.category : "All models";
  const provider = search.provider && providers.includes(search.provider) ? search.provider : "all";
  const update = (value: Partial<RouteSearch>, replace = true) => {
    const patch = "page" in value ? value : { ...value, page: undefined };
    void navigate({
      to: "/$",
      params: { _splat: path.slice(1) },
      search: mergeRouteSearch(search, patch),
      replace,
    });
  };
  const setPage = (nextPage: number) =>
    update({ page: nextPage > 1 ? String(nextPage) : undefined });
  const resetFilters = () => {
    update({
      q: undefined,
      category: undefined,
      provider: undefined,
      context: undefined,
      modality: undefined,
      favorites: undefined,
      page: undefined,
    });
  };
  const filtered = models
    .filter((model) => {
      return (
        matchesModelQuery(model, query, (key) => t(key)) &&
        (category === "All models" || category === model.category) &&
        (provider === "all" || provider === model.provider) &&
        (!onlyFavorites || favorites.includes(model.id)) &&
        (context === "all" || model.context >= Number(context)) &&
        (modality === "all" || model.modalities.includes(modality))
      );
    })
    .sort((a, b) => {
      if (sort === "price") return a.input - b.input;
      if (sort === "context") return b.context - a.context;
      if (sort === "name") return a.name.localeCompare(b.name);
      return Number(!!b.featured) - Number(!!a.featured);
    });
  const pages = Math.max(1, Math.ceil(filtered.length / 6));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * 6, currentPage * 6);
  let title = "Explore the model library";
  let description = "Find the right balance of intelligence, speed and cost.";
  if (props.pricing) {
    title = "Clear pricing. In one place.";
    description = "Compare sample rates side by side. Only pay for what you use when connected.";
  }
  const filterPanel = (
    <aside className="filter-sidebar" aria-label={t("Model filters")}>
      <div className="flex items-center justify-between">
        <strong className="text-sm">{t("Filters")}</strong>
        <Button
          variant="ghost"
          className="icon-button"
          aria-label={t("Reset filters")}
          onClick={resetFilters}
        >
          <X size={14} aria-hidden="true" />
        </Button>
      </div>
      <p className="filter-title">{t("Use case")}</p>
      {categories.map((item) => (
        <Button
          key={item}
          variant="ghost"
          className={`filter-button !justify-start ${category === item ? "selected" : ""}`}
          aria-pressed={category === item}
          onClick={() => update({ category: item })}
        >
          {t(item)}
        </Button>
      ))}
      <p className="filter-title">{t("Provider")}</p>
      <Select
        label="Provider"
        value={provider}
        options={[
          { value: "all", label: "All providers" },
          ...providers.map((item) => ({ value: item, label: item })),
        ]}
        onChange={(value) => update({ provider: value })}
        className="w-full"
      />
      <p className="filter-title">{t("Context window")}</p>
      <Select
        label="Context window"
        value={context}
        onChange={(value) => {
          update({ context: value === "all" ? undefined : value, page: undefined });
        }}
        options={[
          { value: "all", label: "Any context" },
          { value: "200000", label: "200K+" },
          { value: "1000000", label: "1M+" },
        ]}
        className="w-full"
      />
      <p className="filter-title">{t("Input modality")}</p>
      <Select
        label="Input modality"
        value={modality}
        onChange={(value) => {
          update({ modality: value === "all" ? undefined : value, page: undefined });
        }}
        options={["all", "Text", "Image", "Audio"].map((value) => ({
          value,
          label: value === "all" ? "All modalities" : value,
        }))}
        className="w-full"
      />
    </aside>
  );
  return (
    <div className="container-wide public-page catalog-page">
      <PageHeading title={title} description={description} />
      <div className="catalog-layout">
        {filterPanel}
        <section>
          <div className="toolbar">
            <div className="search-field">
              <Search aria-hidden="true" />
              <Input
                aria-label={t("Search models")}
                value={query}
                onChange={(event) => update({ q: event.target.value })}
                placeholder={t("Search models or providers…")}
              />
            </div>
            <Button variant="outline" className="mobile-menu" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal size={16} aria-hidden="true" />
              {t("Filters")}
            </Button>
            <Button
              variant={onlyFavorites ? "secondary" : "outline"}
              className="icon-button"
              aria-label={t("Show favorites")}
              aria-pressed={onlyFavorites}
              onClick={() =>
                update({ favorites: onlyFavorites ? undefined : "1", page: undefined })
              }
            >
              <Star size={16} aria-hidden="true" />
            </Button>
            <div className="segmented">
              <Button
                variant="ghost"
                className={view === "grid" ? "selected" : ""}
                aria-label={t("Grid view")}
                aria-pressed={view === "grid"}
                onClick={() => update({ view: props.pricing ? "grid" : undefined })}
              >
                <LayoutGrid size={15} aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                className={view === "table" ? "selected" : ""}
                aria-label={t("Table view")}
                aria-pressed={view === "table"}
                onClick={() => update({ view: props.pricing ? undefined : "table" })}
              >
                <List size={15} aria-hidden="true" />
              </Button>
            </div>
          </div>
          <div className="catalog-results-meta mb-5 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {t("{{count}} models", { count: filtered.length })}
            </span>
            <Select
              label="Sort models"
              value={sort}
              onChange={(value) =>
                update({ sort: value === "recommended" ? undefined : value, page: undefined })
              }
              options={[
                { value: "recommended", label: "Recommended" },
                { value: "price", label: "Lowest input price" },
                { value: "context", label: "Largest context" },
                { value: "name", label: "Name" },
              ]}
            />
          </div>
          {!visible.length && (
            <EmptyState
              title={onlyFavorites && !favorites.length ? "No favorites yet" : "No matching models"}
              description={
                onlyFavorites && !favorites.length
                  ? "Save a model with the star to keep it close."
                  : "Try a different search or reset your filters."
              }
              action={
                <Button variant="outline" onClick={resetFilters}>
                  {t("Reset filters")}
                </Button>
              }
            />
          )}
          {visible.length > 0 && view === "grid" && (
            <div className="model-grid">
              {visible.map((model) => (
                <ModelCard key={model.id} model={model} />
              ))}
            </div>
          )}
          {visible.length > 0 && view === "table" && (
            <StaticDataTable
              label="Model comparison"
              data={visible}
              columns={[
                {
                  id: "model",
                  label: "Model",
                  cell: (model) => (
                    <AppLink
                      to={`/models/${model.id}`}
                      className="flex items-center gap-3 font-semibold hover:text-primary"
                    >
                      <span className={`provider-mark ${model.tone}`} aria-hidden="true">
                        <ProviderLogo provider={model.provider} fallback={model.monogram} />
                      </span>
                      <span className="min-w-0" translate="no">
                        <span className="block">{model.name}</span>
                        <small className="block text-xs text-muted-foreground font-normal">
                          {model.provider}
                        </small>
                      </span>
                    </AppLink>
                  ),
                },
                {
                  id: "context",
                  label: "Context",
                  cell: (model) => formatCompactNumber(model.context, locale),
                },
                {
                  id: "input",
                  label: "Input / 1M tokens",
                  cell: (model) => formatMoney(model.input, locale),
                },
                {
                  id: "output",
                  label: "Output / 1M tokens",
                  cell: (model) => formatMoney(model.output, locale),
                },
              ]}
            />
          )}
          <Pagination page={currentPage} pages={pages} onChange={setPage} />
          <div className="mt-6">
            <DemoNotice>
              {t("Model details and prices shown here are demo examples, not current quotations.")}
            </DemoNotice>
          </div>
        </section>
      </div>
      {filtersOpen && (
        <Dialog
          open
          onOpenChange={setFiltersOpen}
          title={t("Model filters")}
          contentClassName="mobile-filters sm:max-w-md"
          footer={<Button onClick={() => setFiltersOpen(false)}>{t("Show results")}</Button>}
        >
          {filterPanel}
        </Dialog>
      )}
    </div>
  );
}
