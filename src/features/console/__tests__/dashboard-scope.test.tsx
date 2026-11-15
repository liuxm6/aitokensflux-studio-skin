import { render, screen, within } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it } from "vitest";
import { Dashboard } from "../dashboard";
import { useDemoStore } from "@/demo/store";

const instance = createInstance();
await instance.init({ lng: "en", resources: { en: { translation: {} } } });
beforeEach(() => useDemoStore.getState().reset());
async function renderOverview(base: string, workspace: boolean) {
  const root = createRootRoute();
  const route = createRoute({
    getParentRoute: () => root,
    path: "/$",
    component: () => <Dashboard base={base} org workspace={workspace} />,
  });
  const router = createRouter({
    routeTree: root.addChildren([route]),
    history: createMemoryHistory({ initialEntries: [base + "/console"] }),
  });
  render(
    <I18nextProvider i18n={instance}>
      <RouterProvider router={router} />
    </I18nextProvider>,
  );
  await screen.findByRole("heading", { level: 1 });
}

describe("Overview scope", () => {
  it("organization key counts do not include a newly created personal key", async () => {
    useDemoStore.getState().addKey({
      id: "personal-review",
      name: "Personal only",
      scope: "personal",
      kind: "Personal key",
      active: true,
      budget: 10,
      used: 0,
      created: "2026-11-14",
    });
    await renderOverview("/o/studio", false);
    expect(
      within(screen.getByRole("group", { name: "Active keys" })).getByText("2"),
    ).toBeInTheDocument();
  });
  it("a workspace overview displays requests belonging to that workspace", async () => {
    await renderOverview("/o/studio/w/default", true);
    const table = screen.getByRole("table", { name: "Recent requests" });
    expect(within(table).queryByText("Production API")).not.toBeInTheDocument();
    expect(within(table).getAllByText("Website assistant").length).toBeGreaterThan(0);
  });
});
