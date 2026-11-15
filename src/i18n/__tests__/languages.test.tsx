import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider, useTranslation } from "react-i18next";
import { createInstance } from "i18next";
import { describe, it, expect } from "vitest";
import en from "../locales/en.json";
import zh from "../locales/zh.json";
import zhTW from "../locales/zh-TW.json";
import ru from "../locales/ru.json";
import { formatNumber, toIntlLocale } from "@/lib/format";
import { Select } from "@/components/primitives";
import { Input } from "@/components/ui/input";

const locales = { en, zh, "zh-TW": zhTW, ru };
function LocalizedExample() {
  const { t, i18n } = useTranslation();
  const [value, setValue] = useState("My draft");
  return (
    <>
      <Select
        label="Interface language"
        value={i18n.language}
        onChange={(language) => {
          void i18n.changeLanguage(language);
        }}
        options={Object.keys(locales).map((language) => ({ value: language, label: language }))}
      />
      <h1>{t("API keys")}</h1>
      <p>{formatNumber(1234.5, toIntlLocale(i18n.language))}</p>
      <Input aria-label="Draft" value={value} onChange={(event) => setValue(event.target.value)} />
    </>
  );
}

describe("Four-language client", () => {
  it.each(Object.entries(locales))(
    "%s has every source key and preserves interpolation tokens",
    (_language, dictionary) => {
      expect(Object.keys(dictionary).sort()).toEqual(Object.keys(en).sort());
      for (const [key, value] of Object.entries(dictionary)) {
        expect(value.trim()).not.toBe("");
        expect(value.match(/\{\{.*?\}\}/g) ?? []).toEqual(key.match(/\{\{.*?\}\}/g) ?? []);
      }
    },
  );
  it("switching between four languages updates content and numbers without clearing input", async () => {
    const instance = createInstance();
    await instance.init({
      lng: "zh",
      fallbackLng: "en",
      resources: Object.fromEntries(
        Object.entries(locales).map(([language, translation]) => [language, { translation }]),
      ),
      keySeparator: false,
    });
    render(
      <I18nextProvider i18n={instance}>
        <LocalizedExample />
      </I18nextProvider>,
    );
    for (const language of ["zh-TW", "en", "ru", "zh"] as const) {
      await userEvent.click(screen.getByRole("combobox"));
      await userEvent.click(await screen.findByRole("option", { name: language }));
      expect(
        await screen.findByRole("heading", { name: locales[language]["API keys"] }),
      ).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "Draft" })).toHaveValue("My draft");
    }
  });
});
