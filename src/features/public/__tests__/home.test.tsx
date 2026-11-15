import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from "@tanstack/react-router";
import { createInstance } from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { describe, expect, it } from "vitest";
import { Home } from "../home";
import en from "@/i18n/locales/en.json";
import zh from "@/i18n/locales/zh.json";
import zhTW from "@/i18n/locales/zh-TW.json";
import ru from "@/i18n/locales/ru.json";

const locales = { en, zh, "zh-TW": zhTW, ru };
async function renderHome(language: keyof typeof locales = "en") {
  const instance = createInstance();
  await instance.use(initReactI18next).init({
    lng: language,
    fallbackLng: "en",
    keySeparator: false,
    resources: Object.fromEntries(
      Object.entries(locales).map(([lang, translation]) => [lang, { translation }]),
    ),
  });
  const root = createRootRoute();
  const page = createRoute({ getParentRoute: () => root, path: "/$", component: Home });
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: ["/home"] }),
  });
  render(
    <I18nextProvider i18n={instance}>
      <RouterProvider router={router} />
    </I18nextProvider>,
  );
  await screen.findByRole("heading", { level: 1 });
}

describe("Reference-aligned home", () => {
  it.each([
    ["zh", "让每一个想法，", "遇见合适的智能。"],
    ["zh-TW", "讓每一個想法，", "遇見合適的智慧。"],
  ] as const)(
    "%s groups the hero into complete Chinese phrases",
    async (language, lead, accent) => {
      await renderHome(language);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading.querySelector(".hero-title-lead")).toHaveTextContent(lead);
      expect(heading.querySelector(".hero-accent")).toHaveTextContent(accent);
    },
  );
  it.each(Object.keys(locales) as (keyof typeof locales)[])(
    "%s displays a complete localized heading without literal markup",
    async (language) => {
      await renderHome(language);
      const title = screen.getByRole("heading", { level: 1 });
      const expected = locales[language]["The right intelligence. For every idea."].replace(
        /<\/?(?:lead|accent)>/g,
        "",
      );
      expect(title).toHaveTextContent(expected);
      expect(title.textContent).not.toContain("<accent>");
      expect(
        screen.getByRole("button", { name: locales[language]["View documentation"] }),
      ).toHaveAttribute("href", "/docs");
    },
  );

  it("renders local provider marks alongside the five provider names", async () => {
    await renderHome();
    const strip = document.querySelector(".provider-strip");
    expect(strip).toBeInTheDocument();
    expect(strip?.querySelectorAll("[data-provider]")).toHaveLength(5);
    for (const provider of ["OpenAI", "Anthropic", "Google", "DeepSeek", "Mistral"]) {
      expect(strip).toHaveTextContent(provider);
      expect(strip?.querySelector(`[data-provider="${provider}"]`)).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    }
  });

  it("changing the model updates the copied code example", async () => {
    await renderHome();
    await userEvent.click(screen.getByRole("combobox", { name: "Choose a model" }));
    await userEvent.click(await screen.findByRole("option", { name: "Claude Sonnet" }));
    await userEvent.click(screen.getByRole("button", { name: "Code" }));
    expect(screen.getByText(/model: 'anthropic\/claude-sonnet'/)).toBeInTheDocument();
  });

  it("the wide conversation still sends a local simulated response", async () => {
    await renderHome();
    const send = screen.getByRole("button", { name: "Send demo message" });
    expect(send).toBeDisabled();
    await userEvent.type(
      screen.getByRole("textbox", { name: "Your message" }),
      "Plan my next project",
    );
    await userEvent.click(send);
    await waitFor(() => expect(screen.getByText("Plan my next project")).toBeInTheDocument());
    expect(
      screen.getByText(
        "This is a simulated reply. Your message stays in this browser, and no AI model was called.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Your message" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "Your message" })).toHaveFocus();
  });

  it("switching chat and code preserves the unsent draft", async () => {
    await renderHome();
    const input = screen.getByRole("textbox", { name: "Your message" });
    await userEvent.type(input, "Keep this draft");
    await userEvent.click(screen.getByRole("button", { name: "Code" }));
    expect(input).toHaveValue("Keep this draft");
    await userEvent.click(screen.getByRole("button", { name: "Chat" }));
    expect(input).toHaveValue("Keep this draft");
  });

  it("the composer shows the current draft length and rejects whitespace-only input", async () => {
    await renderHome();
    await userEvent.type(screen.getByRole("textbox", { name: "Your message" }), "   ");
    expect(screen.getByRole("button", { name: "Send demo message" })).toBeDisabled();
    expect(screen.getByLabelText("Message length: 3 of 500")).toHaveTextContent("3/500");
    expect(screen.getByRole("textbox", { name: "Your message" })).toHaveAttribute(
      "maxlength",
      "500",
    );
  });

  it("Enter during IME composition does not submit or clear the message", async () => {
    await renderHome();
    const input = screen.getByRole("textbox", { name: "Your message" });
    await userEvent.type(input, "draft");
    const allowed = fireEvent.keyDown(input, { key: "Enter", code: "Enter", isComposing: true });
    expect(allowed).toBe(false);
    expect(input).toHaveValue("draft");
    expect(
      screen.queryByText(
        "This is a simulated reply. Your message stays in this browser, and no AI model was called.",
      ),
    ).not.toBeInTheDocument();
  });
});
