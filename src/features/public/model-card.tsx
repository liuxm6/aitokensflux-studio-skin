import { Star, ArrowUpRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AppLink } from "@/components/primitives";
import { useDemoStore } from "@/demo/store";
import type { Model } from "@/demo/fixtures";
import { formatCompactNumber, formatMoney, toIntlLocale } from "@/lib/format";
import { ProviderLogo } from "@/components/provider-logo";

export function ModelCard(props: { model: Model; recommendation?: string }) {
  const { t, i18n } = useTranslation();
  const favorites = useDemoStore((state) => state.favorites);
  const toggle = useDemoStore((state) => state.toggleFavorite);
  const locale = toIntlLocale(i18n.language);
  const starred = favorites.includes(props.model.id);
  return (
    <article className="model-card" aria-label={props.model.name}>
      <div className="model-card-top">
        <span className={`provider-mark ${props.model.tone}`} aria-hidden="true">
          <ProviderLogo provider={props.model.provider} fallback={props.model.monogram} />
        </span>
        <span className="tag">{t(props.model.category)}</span>
        <Button
          variant="ghost"
          className="icon-button ml-auto"
          aria-label={t("Favorite {{model}}", { model: props.model.name })}
          aria-pressed={starred}
          onClick={() => toggle(props.model.id)}
        >
          <Star
            size={17}
            className={starred ? "fill-primary text-primary" : "text-muted-foreground"}
            aria-hidden="true"
          />
        </Button>
      </div>
      <AppLink to={`/models/${props.model.id}`}>
        <h3 className="flex items-center justify-between">
          {props.model.name}
          <ArrowUpRight size={17} className="text-muted-foreground" aria-hidden="true" />
        </h3>
        <p>{t(props.model.description)}</p>
      </AppLink>
      {props.recommendation && (
        <div className="model-recommendation">
          <Sparkles size={14} aria-hidden="true" />
          <span>{t(props.recommendation)}</span>
        </div>
      )}
      <div className="model-meta">
        <span>
          {formatCompactNumber(props.model.context, locale)} {t("context")}
        </span>
        <span>
          {formatMoney(props.model.input, locale)}{" "}
          <span className="text-[10px]">/ 1M {t("input")}</span>
        </span>
      </div>
    </article>
  );
}
