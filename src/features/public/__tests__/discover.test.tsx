import { render, screen, waitFor, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createInstance } from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { z } from "zod";
import { beforeEach, describe, expect, it } from "vitest";
import { Discover } from "../discover";
import { useDemoStore } from "@/demo/store";
import en from "@/i18n/locales/en.json";
import zh from "@/i18n/locales/zh.json";
import zhTW from "@/i18n/locales/zh-TW.json";
import ru from "@/i18n/locales/ru.json";

beforeEach(() => {
  useDemoStore.getState().reset();
  useDemoStore.getState().setPreference({ favorites: [] });
});
async function renderDiscover(entry = "/discover", language = "en") {
  const instance = createInstance();
  await instance.use(initReactI18next).init({
    lng: language,
    fallbackLng: "en",
    keySeparator: false,
    resources: {
      en: { translation: en },
      zh: { translation: zh },
      "zh-TW": { translation: zhTW },
      ru: { translation: ru },
    },
  });
  const root = createRootRoute();
  const page = createRoute({
    getParentRoute: () => root,
    path: "/$",
    validateSearch: z.object({
      q: z.string().optional(),
      category: z.string().optional(),
      provider: z.string().optional(),
    }),
    component: Discover,
  });
  const history = createMemoryHistory({ initialEntries: [entry] });
  const router = createRouter({ routeTree: root.addChildren([page]), history });
  render(
    <I18nextProvider i18n={instance}>
      <RouterProvider router={router} />
    </I18nextProvider>,
  );
  await screen.findByRole("heading", { level: 1 });
  return { instance, router, history };
}

describe("Discovery page", () => {
  it("shows three curated examples with working detail links", async () => {
    await renderDiscover();
    expect(screen.getAllByRole("article")).toHaveLength(3);
    const model = screen.getByRole("article", { name: "GPT-4.1" });
    expect(within(model).getByRole("link")).toHaveAttribute("href", "/models/openai/gpt-4.1");
    expect(
      screen.getByText("Curated demo examples, not a live popularity ranking."),
    ).toBeInTheDocument();
  });

  it("choosing a task filters results and browser back restores picks", async () => {
    const { history } = await renderDiscover();
    await userEvent.click(screen.getByRole("button", { name: /Build and debug/ }));
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(2));
    expect(screen.getByRole("article", { name: "Qwen Coder" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Coding" })).toHaveAttribute("aria-pressed", "true");
    await act(async () => {
      history.back();
    });
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Sample picks" })).toBeInTheDocument(),
    );
    expect(screen.getAllByRole("article")).toHaveLength(3);
  });

  it("localized search matches the visible Chinese capability text", async () => {
    await renderDiscover("/discover", "zh");
    await userEvent.type(screen.getByRole("textbox", { name: "搜索模型" }), "编程");
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(2));
    expect(screen.getByRole("article", { name: "Claude Sonnet" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Qwen Coder" })).toBeInTheDocument();
  });

  it("provider selection updates visible results", async () => {
    await renderDiscover();
    await userEvent.click(screen.getByRole("combobox", { name: "Provider" }));
    await userEvent.click(await screen.findByRole("option", { name: "OpenAI" }));
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(2));
    expect(screen.getByRole("article", { name: "GPT Image" })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Claude Sonnet" })).not.toBeInTheDocument();
  });

  it("a query deep link is restored and passed into the full catalog", async () => {
    await renderDiscover("/discover?q=Qwen&category=Coding&provider=Qwen");
    expect(screen.getByRole("textbox", { name: "Search models" })).toHaveValue("Qwen");
    expect(screen.getAllByRole("article")).toHaveLength(1);
    const link = screen.getByRole("button", { name: "Explore the full catalog" });
    const url = new URL(link.getAttribute("href") ?? "", "https://example.test");
    expect(url.pathname).toBe("/models");
    expect(url.searchParams.get("q")).toBe("Qwen");
    expect(url.searchParams.get("category")).toBe("Coding");
    expect(url.searchParams.get("provider")).toBe("Qwen");
  });

  it("empty favorites guides the user and reset restores sample picks", async () => {
    await renderDiscover();
    await userEvent.click(screen.getByRole("button", { name: /Show favorites/ }));
    expect(await screen.findByRole("heading", { name: "No favorites yet" })).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: "Reset filters" })[0]);
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(3));
  });

  it("saving a model is reflected immediately in the favorites view", async () => {
    await renderDiscover();
    await userEvent.click(screen.getByRole("button", { name: "Favorite GPT-4.1" }));
    await userEvent.click(screen.getByRole("button", { name: /Show favorites/ }));
    expect(await screen.findByRole("heading", { name: "Your saved models" })).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("article", { name: "GPT-4.1" })).toBeInTheDocument();
  });

  it("clearing a no-match query removes all hidden constraints", async () => {
    await renderDiscover("/discover?q=not-a-model&category=Coding&provider=OpenAI");
    expect(screen.getByRole("heading", { name: "No matching models" })).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: "Reset filters" })[0]);
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(3));
    expect(screen.getByRole("textbox", { name: "Search models" })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "Provider" })).toHaveTextContent("All providers");
  });

  it("changing language preserves the selected task and updates its content", async () => {
    const { instance } = await renderDiscover("/discover?category=Coding");
    await act(async () => {
      await instance.changeLanguage("ru");
    });
    expect(screen.getByRole("heading", { name: ru["Explore your matches"] })).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getByRole("button", { name: ru.Coding })).toHaveAttribute("aria-pressed", "true");
  });
});
