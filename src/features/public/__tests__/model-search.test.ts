import { createInstance } from "i18next";
import { describe, expect, it } from "vitest";
import { models } from "@/demo/fixtures";
import en from "@/i18n/locales/en.json";
import zh from "@/i18n/locales/zh.json";
import zhTW from "@/i18n/locales/zh-TW.json";
import ru from "@/i18n/locales/ru.json";
import { matchesModelQuery } from "../model-search";

const locales = { en, zh, "zh-TW": zhTW, ru };

describe("Shared model search", () => {
  it("matches identifiers, providers, descriptions, categories and modalities", () => {
    const model = models[2];
    for (const query of [model.id, "gOoGlE", "Explore ideas", "Multimodal", "Audio"]) {
      expect(matchesModelQuery(model, query)).toBe(true);
    }
    expect(matchesModelQuery(model, "not-a-model")).toBe(false);
  });

  it("ignores surrounding whitespace without modifying fixtures", () => {
    const model = Object.freeze({ ...models[0] });
    expect(matchesModelQuery(model, "  OPENAI/GPT-4.1  ")).toBe(true);
    expect(matchesModelQuery(model, " \n\t ")).toBe(true);
    expect(model).toEqual(models[0]);
  });

  it("normalizes full-width query and searchable text with NFKC", () => {
    expect(matchesModelQuery(models[0], "　ＯＰＥＮＡＩ／ＧＰＴ－４．１　")).toBe(true);
    expect(matchesModelQuery({ ...models[0], name: "ＧＰＴ－４．１" }, "gpt-4.1")).toBe(true);
  });

  it.each(Object.keys(locales) as (keyof typeof locales)[])(
    "matches visible %s text and still accepts English terms",
    async (language) => {
      const instance = createInstance();
      await instance.init({
        lng: language,
        fallbackLng: "en",
        keySeparator: false,
        nsSeparator: false,
        resources: Object.fromEntries(
          Object.entries(locales).map(([lang, translation]) => [lang, { translation }]),
        ),
      });
      const model = models[2];
      const translate = (key: string) => instance.t(key);
      for (const key of [model.description, model.category, "Audio"]) {
        expect(matchesModelQuery(model, `  ${translate(key)}  `, translate)).toBe(true);
        expect(matchesModelQuery(model, key, translate)).toBe(true);
      }
    },
  );
});
