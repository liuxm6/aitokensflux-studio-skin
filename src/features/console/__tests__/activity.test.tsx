import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { I18nextProvider } from "react-i18next";
import { createInstance } from "i18next";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActivityPage } from "../activity";

const i18n = createInstance();
await i18n.init({ lng: "en", resources: { en: { translation: {} } } });
afterEach(() => vi.unstubAllGlobals());

async function renderAudit() {
  const root = createRootRoute();
  const page = createRoute({
    getParentRoute: () => root,
    path: "/$",
    component: () => <ActivityPage audit />,
  });
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: ["/console/audit"] }),
  });
  render(
    <I18nextProvider i18n={i18n}>
      <RouterProvider router={router} />
    </I18nextProvider>,
  );
  await screen.findByRole("heading", { level: 1 });
}

describe("Audit export", () => {
  it("exports the filtered audit rows instead of unrelated request logs", async () => {
    let downloaded: Blob | undefined;
    const createObjectURL = vi.fn((blob: Blob) => {
      downloaded = blob;
      return "blob:demo-export";
    });
    vi.stubGlobal(
      "URL",
      Object.assign(class extends URL {}, { createObjectURL, revokeObjectURL: vi.fn() }),
    );
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await renderAudit();
    await userEvent.type(screen.getByRole("textbox"), "Lin Chen");
    await userEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    expect(downloaded).toBeDefined();
    const content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsText(downloaded as Blob);
    });
    expect(content).toContain("id,actor,action,target,date");
    expect(content).toContain("Lin Chen,Updated workspace budget,Production,2026-11-13");
    expect(content).not.toContain("Alex Morgan");
    expect(content).not.toContain("tokens,cost");
  });
});
