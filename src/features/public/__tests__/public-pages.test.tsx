import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  useRouterState,
} from "@tanstack/react-router";
import { createInstance } from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { models } from "@/demo/fixtures";
import { useDemoStore } from "@/demo/store";
import en from "@/i18n/locales/en.json";
import zh from "@/i18n/locales/zh.json";
import zhTW from "@/i18n/locales/zh-TW.json";
import ru from "@/i18n/locales/ru.json";
import { readFileSync } from "node:fs";
import { Catalog } from "../catalog";
import { ModelDetail } from "../model-detail";
import { DocsPage, ProvidersPage, RankingsPage, StatusPage } from "../support";

const locales = { en, zh, "zh-TW": zhTW, ru };
const publicAuditStyles = readFileSync("src/styles/public-audit.css", "utf8");

function PublicPageUnderTest() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  if (path.startsWith("/models/")) return <ModelDetail key={path} id={path.slice(8)} />;
  if (path === "/providers") return <ProvidersPage />;
  if (path === "/docs") return <DocsPage />;
  if (path === "/status") return <StatusPage />;
  if (path === "/rankings") return <RankingsPage />;
  return <Catalog key={path} pricing={path === "/pricing"} />;
}

async function renderPublic(entry: string, language: keyof typeof locales = "en") {
  const instance = createInstance();
  await instance.use(initReactI18next).init({
    lng: language,
    fallbackLng: "en",
    keySeparator: false,
    nsSeparator: false,
    resources: Object.fromEntries(
      Object.entries(locales).map(([lang, translation]) => [lang, { translation }]),
    ),
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
    component: PublicPageUnderTest,
  });
  const history = createMemoryHistory({ initialEntries: [entry] });
  const router = createRouter({ routeTree: root.addChildren([page]), history });
  render(
    <I18nextProvider i18n={instance}>
      <RouterProvider router={router} />
    </I18nextProvider>,
  );
  await screen.findAllByRole("heading");
  return { instance, router, history };
}

async function choose(label: string, option: string) {
  await userEvent.click(screen.getByRole("combobox", { name: label }));
  await userEvent.click(await screen.findByRole("option", { name: option }));
}

beforeEach(() => {
  useDemoStore.getState().reset();
  useDemoStore.getState().setPreference({ favorites: [] });
});

describe("Catalog and pricing interactions", () => {
  it.each(["/pricing", "/models"])(
    "shows provider logos for every table row on %s, including the second page",
    async (path) => {
      await renderPublic(path);
      if (path === "/models")
        await userEvent.click(screen.getByRole("button", { name: "Table view" }));
      const table = screen.getByRole("table", { name: "Model comparison" });
      for (const row of within(table).getAllByRole("row").slice(1)) {
        const logo = row.querySelector("svg[data-provider]");
        expect(logo).toHaveAttribute("aria-hidden", "true");
        expect(logo?.querySelector("path")).toBeInTheDocument();
        expect(within(row).getByRole("link")).toHaveAttribute(
          "href",
          expect.stringContaining("/models/"),
        );
      }
      await userEvent.click(screen.getByRole("button", { name: "Next" }));
      await within(table).findByRole("link", { name: /Qwen Coder/ });
      expect(table.querySelector('[data-provider="Qwen"] path')).toBeInTheDocument();
      expect(table.querySelector('[data-provider="OpenAI"] path')).toBeInTheDocument();
    },
  );
  it.each(Object.keys(locales) as (keyof typeof locales)[])(
    "finds visible category and description text in %s",
    async (language) => {
      const { router, instance } = await renderPublic(
        `/models?q=${encodeURIComponent(locales[language].Coding)}`,
        language,
      );
      expect(screen.getAllByRole("article")).toHaveLength(2);
      expect(screen.getByRole("article", { name: "Qwen Coder" })).toBeInTheDocument();
      await act(async () => {
        await router.navigate({
          to: "/$",
          params: { _splat: "models" },
          search: { q: instance.t(models[0].description) },
        });
      });
      expect(screen.getAllByRole("article")).toHaveLength(1);
      expect(screen.getByRole("article", { name: "GPT-4.1" })).toBeInTheDocument();
    },
  );

  it("accepts a copied model ID with surrounding whitespace", async () => {
    await renderPublic(`/models?q=${encodeURIComponent("  OPENAI/GPT-4.1  ")}`);
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("article", { name: "GPT-4.1" })).toBeInTheDocument();
  });

  it("falls back from unknown filter values instead of keeping invisible constraints", async () => {
    await renderPublic("/models?provider=missing-provider&category=missing-category");
    expect(screen.getByRole("combobox", { name: "Provider" })).toHaveTextContent("All providers");
    expect(screen.getByRole("button", { name: "All models" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getAllByRole("article")).toHaveLength(6);
  });

  it("keeps valid provider, category and query deep links in sync with results", async () => {
    const { router } = await renderPublic("/models?provider=Qwen&category=Coding&q=Qwen");
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("combobox", { name: "Provider" })).toHaveTextContent("Qwen");
    expect(screen.getByRole("textbox", { name: "Search models" })).toHaveValue("Qwen");
    await userEvent.click(screen.getByRole("button", { name: "All models" }));
    await waitFor(() => expect(router.state.location.search.category).toBe("All models"));
    expect(router.state.location.search.provider).toBe("Qwen");
    expect(router.state.location.search.q).toBe("Qwen");
  });

  it("explains empty favorites and restores the catalog from the empty state", async () => {
    await renderPublic("/models");
    await userEvent.click(screen.getByRole("button", { name: "Show favorites" }));
    expect(screen.getByRole("heading", { name: "No favorites yet" })).toBeInTheDocument();
    await userEvent.click(
      within(screen.getByRole("status")).getByRole("button", { name: "Reset filters" }),
    );
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(6));
    expect(screen.getByRole("button", { name: "Show favorites" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it.each(["/models", "/pricing"])("recovers from no matches on %s", async (path) => {
    await renderPublic(`${path}?q=no-such-model&provider=Qwen&category=Coding`);
    expect(screen.getByRole("heading", { name: "No matching models" })).toBeInTheDocument();
    await userEvent.click(
      within(screen.getByRole("status")).getByRole("button", { name: "Reset filters" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Search models" })).toHaveValue(""),
    );
    expect(screen.getByRole("combobox", { name: "Provider" })).toHaveTextContent("All providers");
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("filters context and modality, and resets the page when sorting", async () => {
    await renderPublic("/models");
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getAllByRole("article")).toHaveLength(2);
    await choose("Sort models", "Lowest input price");
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getAllByRole("article")[0]).toHaveAccessibleName("Llama 4");
    await choose("Context window", "1M+");
    expect(screen.getAllByRole("article")).toHaveLength(2);
    await choose("Input modality", "Audio");
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("article", { name: "Gemini Pro" })).toBeInTheDocument();
  });

  it("uses table view by default on pricing and keeps rates and links from fixtures", async () => {
    await renderPublic("/pricing?provider=OpenAI");
    const table = screen.getByRole("table", { name: "Model comparison" });
    expect(within(table).getAllByRole("row")).toHaveLength(3);
    expect(within(table).getByRole("link", { name: /GPT-4.1/ })).toHaveAttribute(
      "href",
      "/models/openai/gpt-4.1",
    );
    expect(within(table).getByRole("cell", { name: "$2.00" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Grid view" }));
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });
});

describe("Model details", () => {
  it.each(["", "-1", "1.5", "1000001"])(
    "does not publish a clamped or misleading cost for invalid token input %j",
    async (value) => {
      await renderPublic("/models/openai/gpt-4.1");
      const input = screen.getByRole("spinbutton", { name: "Input tokens" });
      fireEvent.change(input, { target: { value } });
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAccessibleDescription(
        "Enter a whole number of tokens from 0 to 1,000,000.",
      );
      expect(screen.getByLabelText("Estimated input cost")).toHaveTextContent("—");
      expect(input).toHaveValue(value === "" ? null : Number(value));
    },
  );

  it("calculates only valid whole-token inputs and allows correcting an empty field", async () => {
    await renderPublic("/models/openai/gpt-4.1");
    const input = screen.getByRole("spinbutton", { name: "Input tokens" });
    expect(screen.getByLabelText("Estimated input cost")).toHaveTextContent("$0.20");
    await userEvent.clear(input);
    await userEvent.type(input, "1000000");
    expect(input).toHaveValue(1000000);
    expect(input).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Estimated input cost")).toHaveTextContent("$2.00");
    fireEvent.change(input, { target: { value: "0" } });
    expect(screen.getByLabelText("Estimated input cost")).toHaveTextContent("$0.00");
  });

  it("links the selected tab to its panel and supports keyboard navigation", async () => {
    await renderPublic("/models/openai/gpt-4.1");
    const overview = screen.getByRole("tab", { name: "Overview" });
    const panel = screen.getByRole("tabpanel", { name: "Overview" });
    expect(overview).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", overview.id);
    act(() => overview.focus());
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Providers" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("tab", { name: "Providers" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("table", { name: "Model providers" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "Performance" }));
    expect(screen.getByRole("meter", { name: "Example latency" })).toHaveAttribute(
      "aria-valuenow",
      "420",
    );
    expect(
      screen.getByText("Example response times, not a live service measurement."),
    ).toBeInTheDocument();
  });

  it("copies the selected language example and model ID, and toggles the saved state", async () => {
    const user = userEvent.setup();
    const copy = vi.spyOn(navigator.clipboard, "writeText");
    await renderPublic("/models/openai/gpt-4.1");
    await user.click(screen.getByRole("button", { name: "Copy model ID" }));
    await waitFor(() => expect(copy).toHaveBeenLastCalledWith("openai/gpt-4.1"));
    const favorite = screen.getByRole("button", { name: "Favorite" });
    await user.click(favorite);
    expect(favorite).toHaveAttribute("aria-pressed", "true");
    await user.click(favorite);
    expect(favorite).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Get an API key" })).toHaveAttribute(
      "href",
      "/console/keys",
    );
    await user.click(screen.getByRole("tab", { name: "API example" }));
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    await waitFor(() =>
      expect(copy).toHaveBeenLastCalledWith(expect.stringContaining("model: 'openai/gpt-4.1'")),
    );
    await choose("Code language", "Python");
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    await waitFor(() =>
      expect(copy).toHaveBeenLastCalledWith(expect.stringContaining('model="openai/gpt-4.1"')),
    );
  });

  it("offers a relevant explanation and recovery link for an unknown model", async () => {
    await renderPublic("/models/missing/model");
    expect(screen.getByRole("heading", { name: "Model not found" })).toBeInTheDocument();
    expect(screen.getByText("This model is not in the demo catalog.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: "Back to models" }));
    expect(
      await screen.findByRole("heading", { name: "Explore the model library" }),
    ).toBeInTheDocument();
  });
});

describe("Public page layout constraints", () => {
  it("allows the pricing results track to shrink around its scrollable table", async () => {
    render(<style>{publicAuditStyles}</style>);
    await renderPublic("/pricing");
    const table = screen.getByRole("table", { name: "Model comparison" });
    expect(table.closest("section")).toHaveStyle({ minWidth: "0" });
    const sort = screen.getByRole("combobox", { name: "Sort models" });
    expect(sort.closest(".catalog-results-meta")).toHaveStyle({ flexWrap: "wrap" });
  });

  it("stacks the model tab strip and panel instead of using the primitive's row fallback", async () => {
    render(<style>{publicAuditStyles}</style>);
    await renderPublic("/models/openai/gpt-4.1");
    const tabs = screen.getByRole("tablist", { name: "Model details" }).parentElement;
    expect(tabs).toHaveAttribute("data-orientation", "horizontal");
    expect(tabs).toHaveStyle({ flexDirection: "column" });
    expect(screen.getByRole("tabpanel", { name: "Overview" })).toHaveStyle({ minWidth: "0" });
  });
});

describe("Providers, documentation, status and rankings", () => {
  it("restores provider search from a deep link, trims it and opens the filtered catalog", async () => {
    await renderPublic(`/providers?q=${encodeURIComponent("  oPeNaI  ")}`);
    expect(screen.getByRole("textbox", { name: "Search providers" })).toHaveValue("  oPeNaI  ");
    expect(screen.getAllByRole("article")).toHaveLength(1);
    const link = screen.getByRole("link", { name: "Explore models" });
    expect(
      new URL(link.getAttribute("href") ?? "", "https://example.test").searchParams.get("provider"),
    ).toBe("OpenAI");
    await userEvent.click(link);
    await screen.findByRole("heading", { name: "Explore the model library" });
    expect(screen.getByRole("combobox", { name: "Provider" })).toHaveTextContent("OpenAI");
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("updates the provider search URL and clears no-match results", async () => {
    const { router } = await renderPublic("/providers");
    await userEvent.type(screen.getByRole("textbox", { name: "Search providers" }), "missing");
    await waitFor(() => expect(router.state.location.search.q).toBe("missing"));
    expect(screen.getByRole("heading", { name: "No matching providers" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clear search" }));
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(7));
    expect(screen.getByRole("textbox", { name: "Search providers" })).toHaveValue("");
    expect(router.state.location.search.q ?? "").toBe("");
  });

  it("switches all documentation sections and copies the reserved demo request", async () => {
    const user = userEvent.setup();
    const copy = vi.spyOn(navigator.clipboard, "writeText");
    await renderPublic("/docs");
    const sections = [
      "Quick start",
      "Authentication",
      "Choose a model",
      "Routing and fallback",
      "Errors and limits",
      "Team workspaces",
    ];
    for (const section of sections) {
      const button = screen.getByRole("button", { name: section });
      await user.click(button);
      expect(button).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("heading", { level: 2, name: section })).toBeInTheDocument();
    }
    await user.click(screen.getByRole("button", { name: "Copy example request" }));
    await waitFor(() =>
      expect(copy).toHaveBeenCalledWith(
        expect.stringContaining("https://api.example.test/v1/chat/completions"),
      ),
    );
    expect(copy).toHaveBeenLastCalledWith(expect.stringContaining("DEMO_NOT_A_REAL_KEY"));
    expect(
      screen.getByText(
        "The example URL is reserved for documentation and does not serve requests.",
      ),
    ).toBeInTheDocument();
  });

  it("refreshes only the status preview with an explicit simulated confirmation", async () => {
    const success = vi.spyOn(toast, "success");
    const fetch = vi.spyOn(globalThis, "fetch");
    await renderPublic("/status");
    await userEvent.click(screen.getByRole("button", { name: "Refresh preview" }));
    expect(success).toHaveBeenCalledWith("Sample status refreshed. No live service was checked.");
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getAllByText("Operational")).toHaveLength(4);
  });

  it("sorts only fixture ranking data and switches the sample period", async () => {
    await renderPublic("/rankings");
    const table = screen.getByRole("table", { name: "Model rankings" });
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("GPT-4.1");
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("85,000");
    await choose("Ranking metric", "Lowest latency");
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("Llama 4");
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("210 ms");
    await choose("Ranking period", "This month");
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("220,000");
    expect(within(table).getByRole("link", { name: "Llama 4" })).toHaveAttribute(
      "href",
      "/models/meta/llama-4",
    );
    expect(
      screen.getByText("An optional rankings concept, powered entirely by sample data."),
    ).toBeInTheDocument();
  });
});
