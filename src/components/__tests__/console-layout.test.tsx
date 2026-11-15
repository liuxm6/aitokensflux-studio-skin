import { render, screen } from "@testing-library/react";
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
import { AppShell } from "../app-shell";
import { KeysPage } from "@/features/console/keys";
import { BillingPage } from "@/features/console/billing";
import { useDemoStore } from "@/demo/store";
import zh from "@/i18n/locales/zh.json";

beforeEach(() => useDemoStore.getState().reset());

describe("Chinese console layout", () => {
  it.each(["keys", "credits"])("%s shows one page-wide demo notice", async (section) => {
    const instance = createInstance();
    await instance.init({ lng: "zh", keySeparator: false, resources: { zh: { translation: zh } } });
    const root = createRootRoute();
    const route = createRoute({
      getParentRoute: () => root,
      path: "/$",
      component: () => (
        <AppShell>{section === "keys" ? <KeysPage scope="personal" /> : <BillingPage />}</AppShell>
      ),
    });
    const router = createRouter({
      routeTree: root.addChildren([route]),
      history: createMemoryHistory({ initialEntries: [`/console/${section}`] }),
    });
    render(
      <I18nextProvider i18n={instance}>
        <RouterProvider router={router} />
      </I18nextProvider>,
    );
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getAllByText("设计预览。所有数据与操作均为模拟。")).toHaveLength(1);
    if (section === "credits") {
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("账户余额与充值");
      expect(
        screen.getByText(instance.t("Demo credits have no monetary value.")),
      ).toBeInTheDocument();
    }
  });
});
