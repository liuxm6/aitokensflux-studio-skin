import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
import { BillingPage } from "../billing";
import { useDemoStore } from "@/demo/store";
const instance = createInstance();
await instance.init({ lng: "en", resources: { en: { translation: {} } } });
beforeEach(() => useDemoStore.getState().reset());
async function renderBilling(org: boolean) {
  const root = createRootRoute();
  const page = createRoute({
    getParentRoute: () => root,
    path: "/$",
    component: () => <BillingPage org={org} />,
  });
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: ["/console/credits"] }),
  });
  const view = render(
    <I18nextProvider i18n={instance}>
      <RouterProvider router={router} />
    </I18nextProvider>,
  );
  await screen.findByRole("heading", { level: 1 });
  return view;
}

describe("Demo wallet state", () => {
  it("an organization top-up does not add credits to the personal wallet", async () => {
    const view = await renderBilling(true);
    await userEvent.click(screen.getByRole("button", { name: "Add credits" }));
    await userEvent.click(screen.getByRole("button", { name: "Apply to demo balance" }));
    await screen.findByText("$1,900.40");
    view.unmount();
    await renderBilling(false);
    expect(screen.getByText("$248.60")).toBeInTheDocument();
  });
  it("transferring more than the personal sample balance shows a field error", async () => {
    await renderBilling(true);
    await userEvent.click(screen.getByRole("button", { name: "Transfer personal credits" }));
    await userEvent.clear(screen.getByRole("spinbutton", { name: "Amount in USD" }));
    await userEvent.type(screen.getByRole("spinbutton", { name: "Amount in USD" }), "500");
    await userEvent.click(screen.getByRole("button", { name: "Apply to demo balance" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The amount exceeds your personal demo balance.",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
  it("a voided sample document remains voided after returning to billing", async () => {
    const view = await renderBilling(true);
    await userEvent.click(screen.getByRole("button", { name: "DEMO-2026-014" }));
    await userEvent.click(screen.getByRole("button", { name: "Void document" }));
    await userEvent.click(screen.getByRole("button", { name: "Void document" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    await screen.findByText("Voided");
    view.unmount();
    await renderBilling(true);
    expect(screen.getByText("Voided")).toBeInTheDocument();
  });
});
