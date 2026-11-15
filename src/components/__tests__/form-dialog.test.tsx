import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import { createInstance } from "i18next";
import { describe, it, expect, vi } from "vitest";
import { FormDialog } from "../form-dialog";

const i18n = createInstance();
await i18n.init({ lng: "en", fallbackLng: "en", resources: { en: { translation: {} } } });

describe("Demo form behavior", () => {
  it("rejects an empty name and focuses the invalid field", async () => {
    const save = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <FormDialog
          title="Create a key"
          fields={[{ name: "name", label: "Key name" }]}
          onSave={save}
          onClose={vi.fn()}
        />
      </I18nextProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("This field is required.");
    expect(screen.getByRole("textbox", { name: "Key name" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(save).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Key name" })).toHaveFocus());
  });

  it("saves a valid form with trimmed values", async () => {
    const save = vi.fn();
    const close = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <FormDialog
          title="Create a key"
          fields={[{ name: "name", label: "Key name" }]}
          onSave={save}
          onClose={close}
        />
      </I18nextProvider>,
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "Key name" }),
      "  Website assistant  ",
    );
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(save).toHaveBeenCalledWith({ name: "Website assistant" }));
    expect(close).toHaveBeenCalledOnce();
  });

  it("rejects a negative demo budget without saving", async () => {
    const save = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <FormDialog
          title="Edit key"
          fields={[{ name: "budget", label: "Budget", type: "number", value: "100" }]}
          onSave={save}
          onClose={vi.fn()}
        />
      </I18nextProvider>,
    );
    fireEvent.change(screen.getByRole("spinbutton", { name: "Budget" }), {
      target: { value: "-5" },
    });
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter a number between 0 and 100,000.",
    );
    expect(save).not.toHaveBeenCalled();
  });

  it("keeps the entered value when the save action rejects it", async () => {
    const close = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <FormDialog
          title="Redeem a demo code"
          fields={[{ name: "code", label: "Code", value: "INVALID" }]}
          onSave={() => false}
          onClose={close}
        />
      </I18nextProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Code" })).toHaveValue("INVALID"),
    );
    expect(close).not.toHaveBeenCalled();
  });

  it("dirty Cancel asks before discarding and keeps editing when requested", async () => {
    const close = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <FormDialog
          title="Edit key"
          fields={[{ name: "name", label: "Key name", value: "Original" }]}
          onSave={vi.fn()}
          onClose={close}
        />
      </I18nextProvider>,
    );
    const input = screen.getByRole("textbox", { name: "Key name" });
    await userEvent.clear(input);
    await userEvent.type(input, "Changed");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(input).toHaveValue("Changed");
    expect(close).not.toHaveBeenCalled();
  });

  it("discarding dirty changes closes without saving and exposes field semantics", async () => {
    const close = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <FormDialog
          title="Invite member"
          fields={[
            {
              name: "email",
              label: "Email",
              type: "email",
              autoComplete: "email",
              spellCheck: false,
            },
          ]}
          onSave={vi.fn()}
          onClose={close}
        />
      </I18nextProvider>,
    );
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toHaveAttribute("autocomplete", "email");
    expect(input).toHaveAttribute("spellcheck", "false");
    await userEvent.type(input, "person@example.test");
    await userEvent.keyboard("{Escape}");
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
  });

  it("Escape closes the form without saving", async () => {
    const close = vi.fn();
    const save = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <FormDialog
          title="Edit key"
          fields={[{ name: "name", label: "Key name" }]}
          onSave={save}
          onClose={close}
        />
      </I18nextProvider>,
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(close).toHaveBeenCalled());
    expect(save).not.toHaveBeenCalled();
  });
});
