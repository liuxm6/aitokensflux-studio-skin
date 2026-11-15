import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import { createInstance } from "i18next";
import { beforeEach, describe, expect, it } from "vitest";
import { KeysPage } from "../keys";
import { useDemoStore } from "@/demo/store";

const i18n = createInstance();
await i18n.init({ lng: "en", fallbackLng: "en", resources: { en: { translation: {} } } });
beforeEach(() => useDemoStore.getState().reset());

function renderKeys(scope = "personal", management = false) {
  return render(
    <I18nextProvider i18n={i18n}>
      <KeysPage scope={scope} management={management} />
    </I18nextProvider>,
  );
}

describe("Client key management preview", () => {
  it("management keys do not expose relay budget fields", async () => {
    renderKeys("management", true);
    await userEvent.click(screen.getByRole("button", { name: "Create a key" }));
    expect(screen.queryByRole("spinbutton", { name: "Budget in USD" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Key type" })).not.toBeInTheDocument();
    await userEvent.type(screen.getByRole("textbox", { name: "Key name" }), "Admin preview");
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Create a key" }),
    );
    expect(await screen.findByText(/^DEMO_NOT_A_REAL_KEY_/)).toBeInTheDocument();
  });

  it("an organization admin cannot create owner-only management keys", () => {
    useDemoStore.getState().setRole("admin");
    renderKeys("management", true);
    expect(screen.getByRole("button", { name: "Create a key" })).toBeDisabled();
  });
  it("search returns an actionable empty state when no key matches", async () => {
    renderKeys();
    await userEvent.type(
      screen.getByRole("textbox", { name: "Search API keys" }),
      "nonexistent-project",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Nothing here yet");
    expect(screen.queryByText("Production API")).not.toBeInTheDocument();
  });

  it("creates a nonfunctional key and removes the one-time value after dismissal", async () => {
    renderKeys();
    await userEvent.click(screen.getByRole("button", { name: "Create a key" }));
    expect(screen.queryByRole("combobox", { name: "Key type" })).not.toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Budget in USD" })).toHaveAccessibleDescription(
      "Sample total budget, not a monthly limit. No live spending limit is enforced.",
    );
    await userEvent.type(screen.getByRole("textbox", { name: "Key name" }), "Preview integration");
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Create a key" }),
    );
    expect(await screen.findByText(/^DEMO_NOT_A_REAL_KEY_/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "I have copied it" }));
    await waitFor(() =>
      expect(screen.queryByText(/^DEMO_NOT_A_REAL_KEY_/)).not.toBeInTheDocument(),
    );
    expect(
      within(screen.getByRole("row", { name: /Preview integration/ })).getByText("Personal key"),
    ).toBeInTheDocument();
    expect(localStorage.length).toBe(0);
  });

  it("editing a personal key retains its fixed type without a redundant selector", async () => {
    renderKeys();
    await userEvent.click(screen.getByRole("button", { name: "Manage Production API" }));
    await userEvent.click(screen.getByRole("button", { name: "Edit key" }));
    const name = await screen.findByRole("textbox", { name: "Key name" });
    expect(screen.queryByRole("combobox", { name: "Key type" })).not.toBeInTheDocument();
    await userEvent.clear(name);
    await userEvent.type(name, "Updated personal key");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(
      within(screen.getByRole("row", { name: /Updated personal key/ })).getByText("Personal key"),
    ).toBeInTheDocument();
  });

  it("cancelling deletion keeps the key in the list", async () => {
    renderKeys();
    await userEvent.click(screen.getByRole("button", { name: "Manage Production API" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete key" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByText("Production API")).toBeInTheDocument();
  });

  it("member role cannot create or edit another workspace key", async () => {
    useDemoStore.getState().setRole("member");
    renderKeys("studio/default");
    expect(screen.getByRole("button", { name: "Create a key" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Manage Website assistant" }));
    expect(screen.getByRole("button", { name: "Edit key" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete key" })).toBeDisabled();
  });
});
