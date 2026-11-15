import { useRef, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowUpRight,
  Braces,
  BrainCircuit,
  Image,
  Layers3,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLink, DemoNotice, EmptyState, PageHeading, Select } from "@/components/primitives";
import { models } from "@/demo/fixtures";
import { useDemoStore } from "@/demo/store";
import { formatNumber, toIntlLocale } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ModelCard } from "./model-card";
import { matchesModelQuery } from "./model-search";

type DiscoverySearch = { q?: string; category?: string; provider?: string };
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
const useCases = [
  {
    category: "Coding",
    label: "Build and debug",
    description: "From first draft to working code.",
    icon: Braces,
  },
  {
    category: "Reasoning",
    label: "Think it through",
    description: "Work through complex questions, one step at a time.",
    icon: BrainCircuit,
  },
  {
    category: "Multimodal",
    label: "Connect different formats",
    description: "Explore text, images and audio together.",
    icon: Layers3,
  },
  {
    category: "Creative",
    label: "Create with images",
    description: "Turn a visual idea into a starting point.",
    icon: Image,
  },
];
const recommendationKeys: Record<string, string> = {
  General: "A balanced place to start",
  Coding: "For careful coding and review",
  Multimodal: "For ideas across formats",
};

export function Discover() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as DiscoverySearch;
  const favorites = useDemoStore((state) => state.favorites);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const locale = toIntlLocale(i18n.language);
  const query = search.q ?? "";
  const category = search.category ?? "All models";
  const provider = search.provider ?? "all";
  const normalizedQuery = query.trim().normalize("NFKC").toLowerCase();
  const isFiltered =
    !!normalizedQuery || category !== "All models" || provider !== "all" || onlyFavorites;
  const catalogSearch: DiscoverySearch = {
    q: query.trim() ? query : undefined,
    category: category === "All models" ? undefined : category,
    provider: provider === "all" ? undefined : provider,
  };

  const updateFilters = (patch: Partial<DiscoverySearch>, replace = false) => {
    const next = { ...search, ...patch };
    void navigate({
      to: "/$",
      params: { _splat: "discover" },
      replace,
      search: {
        q: next.q?.trim() ? next.q : undefined,
        category: next.category === "All models" ? undefined : next.category,
        provider: next.provider === "all" ? undefined : next.provider,
      },
    });
  };
  const resetFilters = () => {
    setOnlyFavorites(false);
    updateFilters({ q: undefined, category: undefined, provider: undefined });
  };
  const visibleModels = models.filter((model) => {
    if (!isFiltered) return model.featured;
    return (
      matchesModelQuery(model, query, (key) => t(key)) &&
      (category === "All models" || model.category === category) &&
      (provider === "all" || model.provider === provider) &&
      (!onlyFavorites || favorites.includes(model.id))
    );
  });
  let resultsTitle = "Sample picks";
  let resultsDescription = "A few thoughtful starting points for your next project.";
  if (isFiltered) {
    resultsTitle = onlyFavorites ? "Your saved models" : "Explore your matches";
    resultsDescription = "Follow a model to its details, or save it for later.";
  }

  return (
    <div className="discover-page">
      <div className="container-wide">
        <header className="discover-intro">
          <PageHeading
            title="Find your next favorite model"
            description="Follow your curiosity. Explore models by what you want to create."
          />
          <form
            className="discover-search"
            role="search"
            aria-label={t("Search models")}
            onSubmit={(event) => {
              event.preventDefault();
              resultsHeading.current?.focus({ preventScroll: true });
              resultsHeading.current?.scrollIntoView({ block: "start", behavior: "instant" });
            }}
          >
            <Search className="discover-search-icon" aria-hidden="true" />
            <Input
              aria-label={t("Search models")}
              aria-controls="discover-results"
              placeholder={t("Search models or providers…")}
              value={query}
              onChange={(event) => updateFilters({ q: event.target.value }, true)}
              className="discover-search-input h-[54px] rounded-[14px] pl-12 pr-12 md:text-[15px]"
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                className="discover-search-clear icon-button"
                aria-label={t("Clear search")}
                onClick={() => updateFilters({ q: undefined }, true)}
              >
                <X size={16} aria-hidden="true" />
              </Button>
            )}
          </form>
          <p className="discover-search-hint">{t("Search by name, capability or provider.")}</p>
        </header>

        <section className="discover-usecases" aria-labelledby="discover-usecases-title">
          <h2 id="discover-usecases-title">{t("Start with what you want to do")}</h2>
          <div className="discover-usecase-grid">
            {useCases.map((useCase) => (
              <Button
                key={useCase.category}
                variant="outline"
                className={cn(
                  "discover-usecase h-auto w-full items-start justify-start gap-3 whitespace-normal p-5",
                  category === useCase.category
                    ? "is-active border-primary bg-secondary hover:bg-secondary"
                    : "bg-card hover:bg-card hover:border-ring",
                )}
                aria-pressed={category === useCase.category}
                onClick={() =>
                  updateFilters({
                    category: category === useCase.category ? "All models" : useCase.category,
                  })
                }
              >
                <span className="discover-usecase-icon">
                  <useCase.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="discover-usecase-copy">
                  <strong>{t(useCase.label)}</strong>
                  <span>{t(useCase.description)}</span>
                </span>
              </Button>
            ))}
          </div>
        </section>

        <section
          className="discover-results"
          id="discover-results"
          aria-labelledby="discover-results-title"
        >
          <div className="discover-results-heading">
            <div>
              <div className="discover-title-line">
                {!isFiltered && <Sparkles size={19} aria-hidden="true" />}
                <h2 id="discover-results-title" ref={resultsHeading} tabIndex={-1}>
                  {t(resultsTitle)}
                </h2>
                <span className="discover-result-count" role="status" aria-live="polite">
                  {t("{{count}} models", { count: visibleModels.length })}
                </span>
              </div>
              <p>{t(resultsDescription)}</p>
            </div>
            <Button
              variant="outline"
              render={<AppLink to="/models" search={catalogSearch} />}
              nativeButton={false}
            >
              {t("Explore the full catalog")}
              <ArrowUpRight size={16} aria-hidden="true" />
            </Button>
          </div>
          <div className="discover-filter-bar">
            <div className="discover-categories" role="group" aria-label={t("Use case")}>
              {categories.map((item) => (
                <Button
                  key={item}
                  variant="ghost"
                  className={cn(
                    "discover-category text-xs",
                    category === item &&
                      "is-active bg-secondary text-secondary-foreground hover:bg-secondary",
                  )}
                  aria-pressed={category === item}
                  onClick={() => updateFilters({ category: item })}
                >
                  {t(item === "All models" ? "All use cases" : item)}
                </Button>
              ))}
            </div>
            <div className="discover-filter-controls">
              <Select
                label="Provider"
                value={provider}
                onChange={(value) => updateFilters({ provider: value })}
                options={[
                  { value: "all", label: "All providers" },
                  ...providers.map((value) => ({ value, label: value })),
                ]}
              />
              <Button
                variant={onlyFavorites ? "secondary" : "outline"}
                aria-pressed={onlyFavorites}
                onClick={() => setOnlyFavorites(!onlyFavorites)}
              >
                <Star
                  size={15}
                  className={onlyFavorites ? "fill-current" : ""}
                  aria-hidden="true"
                />
                {t("Show favorites")}
                <span className="discover-favorite-count">
                  {formatNumber(favorites.length, locale)}
                </span>
              </Button>
              <Button variant="ghost" disabled={!isFiltered} onClick={resetFilters}>
                {t("Reset filters")}
              </Button>
            </div>
          </div>

          {visibleModels.length ? (
            <div className="model-grid discover-model-grid">
              {visibleModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  recommendation={!isFiltered ? recommendationKeys[model.category] : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="discover-empty">
              <EmptyState
                title={
                  onlyFavorites && !favorites.length ? "No favorites yet" : "No matching models"
                }
                description={
                  onlyFavorites && !favorites.length
                    ? "Save a model with the star to keep it close."
                    : "Try another task or remove a filter to keep exploring."
                }
                action={
                  <Button variant="outline" onClick={resetFilters}>
                    {t("Reset filters")}
                  </Button>
                }
              />
            </div>
          )}
          <div className="discover-footnote">
            <DemoNotice>{t("Curated demo examples, not a live popularity ranking.")}</DemoNotice>
            <p>
              {t("Model details and prices shown here are demo examples, not current quotations.")}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
