import { optionalLabels } from "./fixtures";

export const publicLinks = [
  { path: "/models", label: "Models" },
  { path: "/discover", label: "Discover" },
  { path: "/pricing", label: "Pricing" },
  { path: "/docs", label: "Documentation" },
];
export const personalLinks = [
  { path: "console", label: "Overview", icon: "overview" },
  { path: "console/keys", label: "API keys", icon: "keys" },
  { path: "console/activity", label: "Activity", icon: "activity" },
  { path: "console/logs", label: "Request logs", icon: "logs" },
  { path: "console/credits", label: "Credits", icon: "billing" },
];
export const personalSettings = [
  { path: "console/settings", label: "Workspace settings", icon: "settings" },
  { path: "console/profile", label: "Profile", icon: "profile" },
  { path: "console/notifications", label: "Notifications", icon: "notifications" },
  { path: "console/privacy", label: "Privacy", icon: "privacy" },
  { path: "console/preferences", label: "Preferences", icon: "preferences" },
];
export const orgLinks = [
  { path: "console", label: "Overview", icon: "overview" },
  { path: "members", label: "Members", icon: "members" },
  { path: "billing", label: "Billing", icon: "billing" },
  { path: "invoices", label: "Statements", icon: "invoices" },
  { path: "activity", label: "Activity", icon: "activity" },
  { path: "audit", label: "Audit trail", icon: "logs" },
  { path: "settings", label: "Organization settings", icon: "settings" },
];
export const workspaceLinks = [
  { path: "console", label: "Overview", icon: "overview" },
  { path: "keys", label: "API keys", icon: "keys" },
  { path: "members", label: "Members", icon: "members" },
  { path: "usage", label: "Usage", icon: "activity" },
  { path: "guardrails", label: "Guardrails", icon: "privacy" },
  { path: "settings", label: "Workspace settings", icon: "settings" },
];

export function getPageLabel(path: string): string {
  const publicPages: Record<string, string> = {
    "/": "Home",
    "/home": "Home",
    "/models": "Models",
    "/discover": "Discover",
    "/providers": "Providers",
    "/pricing": "Pricing",
    "/status": "Service status",
    "/docs": "Documentation",
    "/rankings": "Rankings",
    "/o": "My organizations",
  };
  if (publicPages[path]) return publicPages[path];
  if (path.startsWith("/models/")) return "Model details";
  if (path.startsWith("/invite/")) return "Invitation";
  const context = getContext(path);
  if (context.org) {
    if (path.split("/")[2] !== "studio") return "Page not found";
    return (
      (context.workspace ? workspaceLinks : orgLinks).find((item) => item.path === context.section)
        ?.label ?? "Page not found"
    );
  }
  return (
    [...personalLinks, ...personalSettings].find((item) => `/${item.path}` === path)?.label ??
    optionalLabels[path.replace("/console/", "")] ??
    "Page not found"
  );
}

export function isKnownConsolePage(path: string): boolean {
  if (path === "/o") return true;
  const context = getContext(path);
  if (context.org) {
    if (path === context.base) return true;
    return (context.workspace ? workspaceLinks : orgLinks).some(
      (item) => `${context.base}/${item.path}` === path,
    );
  }
  return (
    [...personalLinks, ...personalSettings].some((item) => `/${item.path}` === path) ||
    Object.keys(optionalLabels).some((item) => `/console/${item}` === path)
  );
}

export function getContext(path: string) {
  const segments = path.split("/").filter(Boolean);
  const org = segments[0] === "o" && segments.length > 1;
  const workspace = org && segments[2] === "w";
  let section = segments[1] ?? "console";
  let base = "/console";
  if (org) {
    section = segments[2] ?? "console";
    base = `/o/${segments[1]}`;
  }
  if (workspace) {
    section = segments[4] ?? "console";
    base += `/w/${segments[3]}`;
  }
  let scope = "personal";
  if (org) scope = workspace ? `${segments[1]}/${segments[3]}` : segments[1];
  return {
    org,
    workspace,
    section,
    base,
    workspaceId: workspace ? segments[3] : undefined,
    scope,
    console: org || segments[0] === "console" || path === "/o",
  };
}
