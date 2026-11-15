import { act, render, screen, waitFor } from "@testing-library/react";
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
import { SettingsPage } from "../settings";
import { useDemoStore } from "@/demo/store";
import { AppShell } from "@/components/app-shell";
import en from "@/i18n/locales/en.json";
import zh from "@/i18n/locales/zh.json";
import zhTW from "@/i18n/locales/zh-TW.json";
beforeEach(() => useDemoStore.getState().reset());
async function renderSettings(section = "profile", org = false, language = "en", shell = false) {
  const instance = createInstance();
  await instance.init({
    lng: language,
    keySeparator: false,
    resources: { en: { translation: en }, zh: { translation: zh }, "zh-TW": { translation: zhTW } },
  });
  const root = createRootRoute();
  const route = createRoute({
    getParentRoute: () => root,
    path: "/$",
    component: () =>
      shell ? (
        <AppShell>
          <SettingsPage section={section} org={org} />
        </AppShell>
      ) : (
        <SettingsPage section={section} org={org} />
      ),
  });
  const router = createRouter({
    routeTree: root.addChildren([route]),
    history: createMemoryHistory({ initialEntries: ["/console/profile"] }),
  });
  const view = render(
    <I18nextProvider i18n={instance}>
      <RouterProvider router={router} />
    </I18nextProvider>,
  );
  await screen.findByRole("heading", { level: 1 });
  return { ...view, instance };
}

describe("Saved preview settings", () => {
  it("system workspace labels follow Chinese language changes", async () => {
    const { instance } = await renderSettings("settings", false, "zh", true);
    expect(
      screen.getByRole("combobox", { name: instance.t("Switch workspace") }),
    ).toHaveTextContent("我的工作空间");
    await act(() => instance.changeLanguage("zh-TW"));
    expect(
      screen.getByRole("combobox", { name: instance.t("Switch workspace") }),
    ).toHaveTextContent("我的工作空間");
    await act(() => instance.changeLanguage("en"));
    expect(screen.getByRole("combobox", { name: "Switch workspace" })).toHaveTextContent(
      "My workspace",
    );
  });

  it.each(["My workspace", "Home"])(
    "preserves the custom name %s even when it is a translation key",
    async (name) => {
      useDemoStore.setState({ workspaceName: name });
      const { instance } = await renderSettings("settings", false, "zh", true);
      expect(
        screen.getByRole("combobox", { name: instance.t("Switch workspace") }),
      ).toHaveTextContent(name);
      await act(() => instance.changeLanguage("zh-TW"));
      expect(
        screen.getByRole("combobox", { name: instance.t("Switch workspace") }),
      ).toHaveTextContent(name);
      act(() => useDemoStore.getState().reset());
      expect(
        screen.getByRole("combobox", { name: instance.t("Switch workspace") }),
      ).toHaveTextContent("我的工作空間");
    },
  );
  it("a saved profile name survives leaving and returning to the page", async () => {
    const view = await renderSettings();
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.clear(screen.getByRole("textbox", { name: "Display name" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Display name" }), "Taylor Review");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByRole("heading", { name: "Taylor Review" });
    view.unmount();
    await renderSettings();
    expect(screen.getByRole("heading", { name: "Taylor Review" })).toBeInTheDocument();
  });

  it("reopening SSO configuration shows the values that were saved", async () => {
    await renderSettings("settings", true);
    await userEvent.click(screen.getByRole("tab", { name: "SSO & SCIM" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Configure" })[0]);
    await userEvent.clear(screen.getByRole("textbox", { name: "Issuer URL" }));
    await userEvent.type(
      screen.getByRole("textbox", { name: "Issuer URL" }),
      "https://id.example.test",
    );
    await userEvent.clear(screen.getByRole("textbox", { name: "Client ID" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Client ID" }), "client-review");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await userEvent.click(screen.getAllByRole("button", { name: "Configure" })[0]);
    expect(screen.getByRole("textbox", { name: "Issuer URL" })).toHaveValue(
      "https://id.example.test",
    );
    expect(screen.getByRole("textbox", { name: "Client ID" })).toHaveValue("client-review");
  });
});
