import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it } from "vitest";
import { GuardrailsPage } from "../guardrails";
import { useDemoStore } from "@/demo/store";
const instance = createInstance();
await instance.init({ lng: "en", resources: { en: { translation: {} } } });
beforeEach(() => useDemoStore.getState().reset());
function renderRules(workspace: string) {
  return render(
    <I18nextProvider i18n={instance}>
      <GuardrailsPage workspace={workspace} />
    </I18nextProvider>,
  );
}

describe("Workspace rule previews", () => {
  it("a rule created in research does not replace production rules", async () => {
    const view = renderRules("research");
    expect(screen.queryByText("Production models")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Add a rule" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Rule name" }), "Research policy");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByText("Research policy");
    view.unmount();
    renderRules("default");
    expect(screen.getByText("Production models")).toBeInTheDocument();
    expect(screen.queryByText("Research policy")).not.toBeInTheDocument();
  });
  it("an empty allow list is represented as no models allowed, not unrestricted access", async () => {
    renderRules("default");
    const row = screen.getByRole("row", { name: /Production models/ });
    await userEvent.click(within(row).getByRole("button", { name: "Edit" }));
    await userEvent.clear(screen.getByRole("textbox", { name: "Allowed models" }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("No models allowed")).toBeInTheDocument();
  });
});
