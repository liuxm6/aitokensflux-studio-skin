import { beforeEach, describe, expect, it } from "vitest";
import { useDemoStore, canManage, canViewBilling } from "../store";
import { getContext } from "../navigation";

beforeEach(() => {
  useDemoStore.getState().reset();
  localStorage.clear();
});

describe("Preview scope and local state", () => {
  it("preserves the organization and workspace encoded in a deep link", () => {
    expect(getContext("/o/studio/w/research/keys")).toMatchObject({
      org: true,
      workspace: true,
      workspaceId: "research",
      base: "/o/studio/w/research",
      section: "keys",
    });
    expect(getContext("/console/keys")).toMatchObject({
      org: false,
      workspace: false,
      base: "/console",
      section: "keys",
    });
  });
  it("billing roles can view finance but cannot manage members or keys", () => {
    expect(canViewBilling("billing")).toBe(true);
    expect(canManage("billing")).toBe(false);
    expect(canViewBilling("member")).toBe(false);
    expect(canManage("owner")).toBe(true);
  });
  it("persists only non-sensitive preferences under a dedicated key", () => {
    useDemoStore
      .getState()
      .setPreference({ language: "ru", theme: "dark", favorites: ["openai/gpt-4.1"] });
    const stored = JSON.parse(localStorage.getItem("aitokensflux-studio.preferences.v1") ?? "{}");
    expect(stored).toEqual({ language: "ru", theme: "dark", favorites: ["openai/gpt-4.1"] });
    expect(Object.keys(localStorage)).toEqual(["aitokensflux-studio.preferences.v1"]);
  });
  it("reset restores edited names, switches and optional-module visibility", () => {
    useDemoStore.setState({
      workspaceName: "Changed workspace",
      notices: { "Usage alerts": false },
      showOptional: true,
    });
    useDemoStore.getState().reset();
    expect(useDemoStore.getState().workspaceName).toBeNull();
    expect(useDemoStore.getState().notices["Usage alerts"]).toBe(true);
    expect(useDemoStore.getState().showOptional).toBe(false);
  });

  it("reset restores deleted mock entities without touching persisted preferences", () => {
    useDemoStore.getState().deleteKey("key-01");
    useDemoStore.getState().removeMember("m2");
    useDemoStore.getState().setPreference({ language: "ru" });
    useDemoStore.getState().reset();
    expect(useDemoStore.getState().keys.some((key) => key.id === "key-01")).toBe(true);
    expect(useDemoStore.getState().members.some((member) => member.id === "m2")).toBe(true);
    expect(useDemoStore.getState().language).toBe("ru");
  });
});
