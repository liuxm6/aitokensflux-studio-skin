import type { Model } from "@/demo/fixtures";

/** Matches both fixture terms and the text visible in the current language. */
export function matchesModelQuery(
  model: Model,
  query: string,
  translate: (key: string) => string = (key) => key,
): boolean {
  const normalizedQuery = query.trim().normalize("NFKC").toLowerCase();
  if (!normalizedQuery) return true;

  const searchable = [
    model.id,
    model.name,
    model.provider,
    model.description,
    translate(model.description),
    model.category,
    translate(model.category),
    ...model.modalities,
    ...model.modalities.map((modality) => translate(modality)),
  ]
    .join(" ")
    .normalize("NFKC")
    .toLowerCase();

  return searchable.includes(normalizedQuery);
}
