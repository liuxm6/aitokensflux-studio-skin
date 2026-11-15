import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import { createInstance } from "i18next";
import { describe, it, expect } from "vitest";
import { SectionTabs } from "../section-tabs";

const instance = createInstance();
await instance.init({ lng: "en", resources: { en: { translation: {} } } });

function TabsExample() {
  const [tab, setTab] = useState("Overview");
  return (
    <SectionTabs
      label="Model details"
      value={tab}
      onChange={setTab}
      options={["Overview", "Providers", "API example"]}
    >
      <p>{tab} content</p>
    </SectionTabs>
  );
}

describe("Section keyboard navigation", () => {
  it("each active section exposes a panel linked to its selected tab", async () => {
    render(
      <I18nextProvider i18n={instance}>
        <TabsExample />
      </I18nextProvider>,
    );
    await userEvent.click(screen.getByRole("tab", { name: "Providers" }));
    const tab = screen.getByRole("tab", { name: "Providers" });
    const panel = screen.getByRole("tabpanel", { name: "Providers" });
    expect(tab).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveTextContent("Providers content");
  });
  it("ArrowRight focuses the next section and Enter selects it", async () => {
    render(
      <I18nextProvider i18n={instance}>
        <TabsExample />
      </I18nextProvider>,
    );
    await userEvent.click(screen.getByRole("tab", { name: "Overview" }));
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Providers" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("tab", { name: "Providers" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "false");
  });
});
