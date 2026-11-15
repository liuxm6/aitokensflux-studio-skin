import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it } from "vitest";
import { MembersPage } from "../members";
import { useDemoStore } from "@/demo/store";
const instance = createInstance();
await instance.init({ lng: "en", resources: { en: { translation: {} } } });
beforeEach(() => useDemoStore.getState().reset());
function renderMembers(workspace?: string) {
  return render(
    <I18nextProvider i18n={instance}>
      <MembersPage workspace={workspace} />
    </I18nextProvider>,
  );
}

describe("Workspace membership boundaries", () => {
  it("removing a workspace member preserves their organization membership", async () => {
    const view = renderMembers("research");
    const row = screen.getByRole("row", { name: /Sofia Petrova/ });
    await userEvent.click(within(row).getByRole("button", { name: "Remove" }));
    await userEvent.click(screen.getByRole("button", { name: "Remove member" }));
    await waitFor(() =>
      expect(screen.queryByRole("row", { name: /Sofia Petrova/ })).not.toBeInTheDocument(),
    );
    view.unmount();
    renderMembers();
    expect(screen.getByRole("row", { name: /Sofia Petrova/ })).toBeInTheDocument();
  });
  it("editing a workspace role does not overwrite the organization role", async () => {
    const view = renderMembers("research");
    await userEvent.click(screen.getByRole("button", { name: "Edit Sofia Petrova" }));
    await userEvent.click(screen.getByRole("combobox", { name: /role/i }));
    await userEvent.click(await screen.findByRole("option", { name: "auditor" }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    view.unmount();
    renderMembers();
    expect(
      within(screen.getByRole("row", { name: /Sofia Petrova/ })).getByText("billing"),
    ).toBeInTheDocument();
  });
});
