import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import zh from "./locales/zh.json";
import zhTW from "./locales/zh-TW.json";
import ru from "./locales/ru.json";
import { useDemoStore } from "@/demo/store";

export const resources = {
  en: { translation: en },
  zh: { translation: zh },
  "zh-TW": { translation: zhTW },
  ru: { translation: ru },
};
export const i18n = createInstance();
await i18n.use(initReactI18next).init({
  resources,
  lng: useDemoStore.getState().language,
  supportedLngs: Object.keys(resources),
  fallbackLng: "en",
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});
