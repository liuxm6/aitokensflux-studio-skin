import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { I18nextProvider } from "react-i18next";
import { Toaster } from "sonner";
import { router } from "./router";
import { i18n } from "./i18n";
import { useDemoStore } from "./demo/store";
import { TooltipProvider } from "./components/ui/tooltip";
import { toIntlLocale } from "./lib/format";
import "./styles/index.css";

function App() {
  const theme = useDemoStore((state) => state.theme);
  const language = useDemoStore((state) => state.language);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      document.documentElement.classList.toggle(
        "dark",
        theme === "dark" || (theme === "system" && media.matches),
      );
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  useEffect(() => {
    void i18n.changeLanguage(language);
    document.documentElement.lang = toIntlLocale(language) ?? "en";
  }, [language]);
  return (
    <I18nextProvider i18n={i18n}>
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster position="bottom-center" richColors theme={theme} />
      </TooltipProvider>
    </I18nextProvider>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing application root");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
