import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";
import { Select } from "../primitives";
import { FormDialog } from "../form-dialog";

const instance = createInstance();
await instance.init({ lng: "en", resources: { en: { translation: {} } } });
const options = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
  { value: "c", label: "Unavailable", disabled: true },
];
function Example(props: { disabled?: boolean }) {
  const [value, setValue] = useState("a");
  return (
    <Select
      label="Model"
      value={value}
      onChange={setValue}
      options={options}
      disabled={props.disabled}
    />
  );
}

describe("Unified dropdown", () => {
  it("preserves an entity name that also happens to be a translation key", async () => {
    const localized = createInstance();
    await localized.init({
      lng: "zh",
      resources: { zh: { translation: { Home: "首页", Workspace: "空间" } } },
    });
    render(
      <I18nextProvider i18n={localized}>
        <Select
          label="Workspace"
          value="custom"
          onChange={() => {}}
          options={[{ value: "custom", label: "Home", localizeLabel: false }]}
        />
      </I18nextProvider>,
    );
    expect(screen.getByRole("combobox", { name: "空间" })).toHaveTextContent("Home");
  });
  it("opens a styled listbox and commits a selected option", async () => {
    render(
      <I18nextProvider i18n={instance}>
        <Example />
      </I18nextProvider>,
    );
    const trigger = screen.getByRole("combobox", { name: "Model" });
    expect(trigger.tagName).toBe("BUTTON");
    await userEvent.click(trigger);
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Alpha" })).toHaveAttribute("aria-selected", "true");
    await userEvent.click(screen.getByRole("option", { name: "Beta" }));
    await waitFor(() => expect(trigger).toHaveTextContent("Beta"));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("Escape closes without changing the selection and restores focus", async () => {
    render(
      <I18nextProvider i18n={instance}>
        <Example />
      </I18nextProvider>,
    );
    const trigger = screen.getByRole("combobox", { name: "Model" });
    await userEvent.click(trigger);
    await screen.findByRole("listbox");
    await userEvent.keyboard("{ArrowDown}{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(trigger).toHaveTextContent("Alpha");
    expect(trigger).toHaveFocus();
  });

  it("keyboard users cannot commit a disabled option and can select an enabled one", async () => {
    render(
      <I18nextProvider i18n={instance}>
        <Example />
      </I18nextProvider>,
    );
    const trigger = screen.getByRole("combobox", { name: "Model" });
    await userEvent.tab();
    expect(trigger).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(await screen.findByRole("option", { name: "Unavailable" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await userEvent.keyboard("{End}");
    await waitFor(() => expect(screen.getByRole("option", { name: "Unavailable" })).toHaveFocus());
    await userEvent.keyboard("{Enter}");
    expect(trigger).toHaveTextContent("Alpha");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{ArrowUp}");
    await waitFor(() => expect(screen.getByRole("option", { name: "Beta" })).toHaveFocus());
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(trigger).toHaveTextContent("Beta"));
  });

  it("disabled controls do not open", async () => {
    render(
      <I18nextProvider i18n={instance}>
        <Example disabled />
      </I18nextProvider>,
    );
    expect(screen.getByRole("combobox")).toBeDisabled();
    await userEvent.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("an unselected required dropdown exposes its error and receives focus", async () => {
    render(
      <I18nextProvider i18n={instance}>
        <FormDialog
          title="Invite member"
          fields={[{ name: "role", label: "Role", options: ["member", "admin"] }]}
          onSave={() => {}}
          onClose={() => {}}
        />
      </I18nextProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("This field is required.");
    expect(screen.getByRole("combobox", { name: "Role" })).toHaveAttribute("aria-invalid", "true");
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Role" })).toHaveFocus());
  });

  it("a dropdown inside a form dialog saves the controlled value", async () => {
    let saved: Record<string, string> | undefined;
    render(
      <I18nextProvider i18n={instance}>
        <FormDialog
          title="Invite member"
          fields={[{ name: "role", label: "Role", value: "member", options: ["member", "admin"] }]}
          onSave={(value) => {
            saved = value;
          }}
          onClose={() => {}}
        />
      </I18nextProvider>,
    );
    await userEvent.click(screen.getByRole("combobox", { name: "Role" }));
    await userEvent.click(await screen.findByRole("option", { name: "admin" }));
    expect(saved).toBeUndefined();
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(saved).toEqual({ role: "admin" }));
  });
});
