import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it } from "vitest";
import { ConceptPage } from "../concept";
import { useDemoStore } from "@/demo/store";

const i18n = createInstance();
await i18n.init({ lng: "en", resources: { en: { translation: {} } } });
beforeEach(() => {
  useDemoStore.getState().reset();
  useDemoStore.setState({ showOptional: true });
});

function renderConcept() {
  return render(
    <I18nextProvider i18n={i18n}>
      <ConceptPage section="files" />
    </I18nextProvider>,
  );
}

describe("Concept item deletion", () => {
  it("requires confirmation and keeps the example when cancelled", async () => {
    renderConcept();
    await userEvent.click(screen.getByRole("button", { name: "Add an example" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Example name" }), "Local file");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    const row = screen.getByRole("row", { name: /Local file/ });
    await userEvent.click(within(row).getByRole("button", { name: "Remove" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("row", { name: /Local file/ })).toBeInTheDocument();
  });

  it("removes the example only after confirmation", async () => {
    renderConcept();
    await userEvent.click(screen.getByRole("button", { name: "Add an example" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Example name" }), "Temporary file");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    const row = screen.getByRole("row", { name: /Temporary file/ });
    await userEvent.click(within(row).getByRole("button", { name: "Remove" }));
    await userEvent.click(screen.getByRole("button", { name: "Remove example" }));
    await waitFor(() =>
      expect(screen.queryByRole("row", { name: /Temporary file/ })).not.toBeInTheDocument(),
    );
  });
});
