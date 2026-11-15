import { create } from "zustand";
import { initialKeys, initialMembers, type DemoKey, type DemoMember } from "./fixtures";

export type Theme = "light" | "dark" | "system";
export type Scenario = "normal" | "empty" | "loading" | "error" | "restricted" | "paused";
export type Role = "owner" | "admin" | "billing" | "member" | "auditor";
type PreferenceState = { language: string; theme: Theme; favorites: string[] };
const preferenceKey = "aitokensflux-studio.preferences.v1";
const defaults: PreferenceState = { language: "zh", theme: "light", favorites: [] };

function readPreferences(): PreferenceState {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(preferenceKey) ?? "null");
    if (!parsed || typeof parsed !== "object") return defaults;
    const value = parsed as Partial<PreferenceState>;
    return {
      language: ["zh", "zh-TW", "en", "ru"].includes(value.language ?? "")
        ? String(value.language)
        : defaults.language,
      theme: ["light", "dark", "system"].includes(value.theme ?? "")
        ? (value.theme as Theme)
        : "light",
      favorites: Array.isArray(value.favorites)
        ? value.favorites.filter((item): item is string => typeof item === "string")
        : [],
    };
  } catch {
    return defaults;
  }
}

export type DemoRule = {
  id: string;
  name: string;
  workspace: string;
  target: string;
  targetId?: string;
  model: string;
};
type DemoData = {
  role: Role;
  scenario: Scenario;
  showOptional: boolean;
  signedIn: boolean;
  keys: DemoKey[];
  members: DemoMember[];
  balance: number;
  organizationBalance: number;
  workspaces: { id: string; name: string; paused: boolean }[];
  rules: DemoRule[];
  notices: Record<string, boolean>;
  // null means the system label; custom names, including English keys, stay literal.
  workspaceName: string | null;
  profileName: string;
  orgName: string;
  sso: { issuer: string; client: string };
  scim: { group: string; role: string };
  organizations: { id: string; name: string }[];
  conceptItems: Record<string, { id: string; name: string }[]>;
  voidedDocuments: string[];
  invitationAccepted: boolean;
};

function initialDemoData(): DemoData {
  return {
    role: "owner",
    scenario: "normal",
    showOptional: false,
    signedIn: true,
    keys: structuredClone(initialKeys),
    members: structuredClone(initialMembers),
    balance: 248.6,
    organizationBalance: 1850.4,
    workspaces: [
      { id: "default", name: "Production", paused: false },
      { id: "research", name: "Research lab", paused: false },
    ],
    rules: [
      {
        id: "r1",
        name: "Production models",
        workspace: "default",
        target: "Workspace",
        model: "GPT-4.1, Claude Sonnet",
      },
    ],
    notices: {
      "Usage alerts": true,
      "Product updates": false,
      "Zero data retention": true,
      "Allow training": false,
      "Automatic fallback": true,
    },
    workspaceName: null,
    profileName: "Alex Morgan",
    orgName: "Studio Collective",
    sso: { issuer: "", client: "" },
    scim: { group: "", role: "member" },
    organizations: [],
    conceptItems: {},
    voidedDocuments: [],
    invitationAccepted: false,
  };
}

type DemoStore = PreferenceState &
  DemoData & {
    resetVersion: number;
    setPreference: (value: Partial<PreferenceState>) => void;
    toggleFavorite: (id: string) => void;
    setRole: (role: Role) => void;
    setScenario: (scenario: Scenario) => void;
    addKey: (key: DemoKey) => void;
    updateKey: (id: string, value: Partial<DemoKey>) => void;
    deleteKey: (id: string) => void;
    addMember: (member: DemoMember) => void;
    updateMember: (id: string, value: Partial<DemoMember>) => void;
    removeMember: (id: string) => void;
    reset: () => void;
  };

export const useDemoStore = create<DemoStore>((set, get) => ({
  ...readPreferences(),
  ...initialDemoData(),
  resetVersion: 0,
  setPreference: (value) => {
    set(value);
    const state = get();
    try {
      localStorage.setItem(
        preferenceKey,
        JSON.stringify({
          language: state.language,
          theme: state.theme,
          favorites: state.favorites,
        }),
      );
    } catch {
      /* Storage can be disabled in private browsing. */
    }
  },
  toggleFavorite: (id) => {
    const favorites = get().favorites;
    get().setPreference({
      favorites: favorites.includes(id)
        ? favorites.filter((value) => value !== id)
        : [...favorites, id],
    });
  },
  setRole: (role) => set({ role }),
  setScenario: (scenario) => set({ scenario }),
  addKey: (key) => set((state) => ({ keys: [...state.keys, key] })),
  updateKey: (id, value) =>
    set((state) => ({
      keys: state.keys.map((key) => (key.id === id ? { ...key, ...value } : key)),
    })),
  deleteKey: (id) => set((state) => ({ keys: state.keys.filter((key) => key.id !== id) })),
  addMember: (member) => set((state) => ({ members: [...state.members, member] })),
  updateMember: (id, value) =>
    set((state) => ({
      members: state.members.map((member) => (member.id === id ? { ...member, ...value } : member)),
    })),
  removeMember: (id) =>
    set((state) => ({ members: state.members.filter((member) => member.id !== id) })),
  reset: () => set((state) => ({ ...initialDemoData(), resetVersion: state.resetVersion + 1 })),
}));

export function canManage(role: Role): boolean {
  return role === "owner" || role === "admin";
}
export function canViewBilling(role: Role): boolean {
  return role === "owner" || role === "admin" || role === "billing";
}

export function isDemoWorkspaceMember(member: DemoMember, workspace: string): boolean {
  return (
    member.role === "owner" ||
    member.role === "admin" ||
    (member.workspaces ?? [member.workspace]).includes(workspace)
  );
}
export function demoWorkspaceRole(member: DemoMember, workspace: string): string {
  if (member.role === "owner" || member.role === "admin") return "admin";
  return member.workspaceRoles?.[workspace] ?? "member";
}

let nextId = 0;
// Identifiers are deliberately non-secret and work on HTTP preview hosts as well as localhost.
export function createDemoId(prefix: string): string {
  return `${prefix}-demo-${++nextId}`;
}
