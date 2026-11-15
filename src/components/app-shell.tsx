import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Menu,
  Search,
  Sun,
  Moon,
  ArrowUpRight,
  ChevronRight,
  SlidersHorizontal,
  LayoutDashboard,
  KeyRound,
  Activity,
  ScrollText,
  Wallet,
  Users,
  Settings,
  UserRound,
  Bell,
  Shield,
  Palette,
  FileText,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog } from "./dialog";
import { AppLink, Select, DemoNotice } from "./primitives";
import { BrandMark } from "./brand-mark";
import { PreviewControls } from "@/features/preview/controls";
import { AuthDialog } from "@/features/preview/auth-dialog";
import {
  getContext,
  getPageLabel,
  orgLinks,
  personalLinks,
  personalSettings,
  publicLinks,
  workspaceLinks,
} from "@/demo/navigation";
import { models, optionalLabels } from "@/demo/fixtures";
import { canManage, canViewBilling, useDemoStore } from "@/demo/store";

const icons: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  keys: KeyRound,
  activity: Activity,
  logs: ScrollText,
  billing: Wallet,
  members: Users,
  settings: Settings,
  profile: UserRound,
  notifications: Bell,
  privacy: Shield,
  preferences: Palette,
  invoices: FileText,
};

export function Brand() {
  return (
    <AppLink to="/home" className="brand">
      <span className="brand-symbol">
        <BrandMark />
      </span>
      <span>Ai Tokens Flux</span>
    </AppLink>
  );
}

export function AppShell(props: { children: ReactNode }) {
  const { t } = useTranslation();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const context = getContext(path);
  const isHome = path === "/" || path === "/home";
  const theme = useDemoStore((state) => state.theme);
  const language = useDemoStore((state) => state.language);
  const orgName = useDemoStore((state) => state.orgName);
  const workspaceName = useDemoStore((state) => state.workspaceName) ?? t("My workspace");
  const workspaces = useDemoStore((state) => state.workspaces);
  const pageLabel = getPageLabel(path);
  const currentWorkspace = workspaces.find((workspace) => workspace.id === context.workspaceId);
  useEffect(() => {
    document.title = `${t(pageLabel)} · Ai Tokens Flux — new-api Skin Demo`;
  }, [pageLabel, t]);
  const setPreference = useDemoStore((state) => state.setPreference);
  const [review, setReview] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [command, setCommand] = useState(false);
  const [auth, setAuth] = useState(false);
  const [query, setQuery] = useState("");
  const previousPath = useRef(path);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommand((open) => !open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    if (previousPath.current !== path) {
      previousPath.current = path;
      window.scrollTo({ top: 0, behavior: "instant" });
      document.getElementById("main-content")?.focus({ preventScroll: true });
    }
  }, [path]);
  const utilities = (
    <div className="top-actions">
      <Button
        variant="ghost"
        className="icon-button desktop-action"
        aria-label={t("Search pages and models")}
        onClick={() => setCommand(true)}
      >
        <Search size={18} aria-hidden="true" />
      </Button>
      <Select
        label="Interface language"
        value={language}
        onChange={(value) => setPreference({ language: value })}
        options={[
          { value: "zh", label: "简体中文" },
          { value: "zh-TW", label: "繁體中文" },
          { value: "en", label: "English" },
          { value: "ru", label: "Русский" },
        ]}
        className="lang-select"
      />
      <Button
        variant="ghost"
        className="icon-button desktop-action"
        aria-label={t("Toggle color theme")}
        onClick={() => setPreference({ theme: theme === "dark" ? "light" : "dark" })}
      >
        {theme === "dark" ? (
          <Sun size={18} aria-hidden="true" />
        ) : (
          <Moon size={18} aria-hidden="true" />
        )}
      </Button>
      {!context.console && (
        <Button variant="ghost" className="desktop-action" onClick={() => setAuth(true)}>
          {t("Sign in")}
        </Button>
      )}
      {!context.console && (
        <Button className="desktop-action !ml-3" onClick={() => setAuth(true)}>
          {t("Get started")}
          <ArrowUpRight size={15} aria-hidden="true" />
        </Button>
      )}
      <Button
        variant="ghost"
        className="icon-button mobile-menu"
        aria-label={t("Open navigation")}
        aria-expanded={mobile}
        onClick={() => setMobile(true)}
      >
        <Menu size={20} aria-hidden="true" />
      </Button>
    </div>
  );
  const links = [
    ...publicLinks,
    { path: "/home", label: "Home" },
    { path: "/providers", label: "Providers" },
    { path: "/status", label: "Service status" },
    ...personalLinks.map((item) => ({ path: `/${item.path}`, label: item.label })),
    { path: "/o", label: "My organizations" },
    ...models.map((model) => ({ path: `/models/${model.id}`, label: model.name })),
  ].filter((item) => `${t(item.label)} ${item.label}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        {t("Skip to content")}
      </a>
      {context.console ? (
        <div className="console-layout">
          <Sidebar path={path} />
          <div className="console-main">
            <header className="console-topbar">
              <nav className="breadcrumb" aria-label={t("Breadcrumb")}>
                <Building2 size={15} aria-hidden="true" />
                <span className="context-label">{context.org ? orgName : workspaceName}</span>
                {currentWorkspace && (
                  <>
                    <ChevronRight className="context-label" aria-hidden="true" />
                    <span className="context-label">{currentWorkspace.name}</span>
                  </>
                )}
                <ChevronRight aria-hidden="true" />
                <span aria-current="page" title={t(pageLabel)}>
                  {t(pageLabel)}
                </span>
              </nav>
              {utilities}
            </header>
            <main id="main-content" tabIndex={-1} className="console-content outline-none">
              {props.children}
              <div className="mt-10 flex flex-wrap justify-between gap-3 items-center">
                <DemoNotice />
                <small className="text-[10px] text-muted-foreground">
                  Powered by new-api · QuantumNous
                </small>
              </div>
            </main>
          </div>
        </div>
      ) : (
        <>
          <header className={isHome ? "topbar home-topbar" : "topbar"}>
            <div className="container-wide topbar-inner">
              <Brand />
              <nav className="top-nav desktop-nav" aria-label={t("Main navigation")}>
                {publicLinks.map((item) => (
                  <AppLink
                    key={item.path}
                    to={item.path}
                    className={path.startsWith(item.path) ? "active" : ""}
                    aria-current={path.startsWith(item.path) ? "page" : undefined}
                  >
                    {t(item.label)}
                  </AppLink>
                ))}
              </nav>
              {utilities}
            </div>
          </header>
          <main id="main-content" tabIndex={-1} className="outline-none">
            {props.children}
          </main>
          <footer className="footer">
            <div className="container-wide footer-inner">
              <div>
                <Brand />
                <small className="block mt-3">Powered by new-api · © QuantumNous</small>
              </div>
              <div className="footer-links">
                {[
                  { path: "/providers", label: "Providers" },
                  { path: "/status", label: "Service status" },
                  { path: "/docs", label: "Documentation" },
                  { path: "/o", label: "Organizations" },
                ].map((link) => (
                  <AppLink to={link.path} key={link.path} className="text-xs">
                    {t(link.label)}
                  </AppLink>
                ))}
              </div>
              <DemoNotice />
            </div>
          </footer>
        </>
      )}
      <Button
        variant="outline"
        className="review-trigger !rounded-full w-11 px-0 sm:w-auto sm:px-4"
        aria-label={t("Preview controls")}
        title={t("Preview controls")}
        onClick={() => setReview(true)}
      >
        <SlidersHorizontal size={14} aria-hidden="true" />
        <span className="hidden sm:inline">{t("Preview controls")}</span>
      </Button>
      <PreviewControls open={review} onClose={() => setReview(false)} />
      {auth && <AuthDialog onClose={() => setAuth(false)} />}
      <Dialog
        open={mobile}
        onOpenChange={setMobile}
        title={t("Navigation")}
        contentClassName="mobile-sidebar sm:max-w-md"
      >
        <div className="flex flex-wrap gap-2 mb-5">
          <Button
            variant="outline"
            onClick={() => {
              setMobile(false);
              setCommand(true);
            }}
          >
            <Search size={16} aria-hidden="true" />
            {t("Search")}
          </Button>
          <Button
            variant="outline"
            onClick={() => setPreference({ theme: theme === "dark" ? "light" : "dark" })}
          >
            {t("Toggle color theme")}
          </Button>
          {!context.console && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setMobile(false);
                  setAuth(true);
                }}
              >
                {t("Sign in")}
              </Button>
              <Button
                onClick={() => {
                  setMobile(false);
                  setAuth(true);
                }}
              >
                {t("Get started")}
              </Button>
            </>
          )}
        </div>
        {context.console ? (
          <Sidebar path={path} onNavigate={() => setMobile(false)} />
        ) : (
          <nav className="grid gap-2">
            {[
              ...publicLinks,
              { path: "/providers", label: "Providers" },
              { path: "/console", label: "Open workspace" },
            ].map((item) => (
              <AppLink
                to={item.path}
                key={item.path}
                onClick={() => setMobile(false)}
                className="sidebar-link"
              >
                {t(item.label)}
              </AppLink>
            ))}
          </nav>
        )}
      </Dialog>
      <Dialog
        open={command}
        onOpenChange={setCommand}
        title={t("Where would you like to go?")}
        description={t("Search pages and models")}
        contentClassName="sm:max-w-xl"
      >
        <div className="search-field mb-4">
          <Search aria-hidden="true" />
          <Input
            autoFocus
            aria-label={t("Search pages and models")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("Search pages and models…")}
          />
        </div>
        <div className="max-h-80 overflow-auto">
          {links.map((link) => (
            <AppLink
              key={link.path}
              to={link.path}
              onClick={() => {
                setCommand(false);
                setQuery("");
              }}
              className="sidebar-link !justify-between"
            >
              {t(link.label)}
              <ArrowUpRight size={15} aria-hidden="true" />
            </AppLink>
          ))}
          {!links.length && (
            <p className="p-5 text-muted-foreground">{t("No matching pages or models.")}</p>
          )}
        </div>
      </Dialog>
    </>
  );
}

function Sidebar(props: { path: string; onNavigate?: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const context = getContext(props.path);
  const role = useDemoStore((state) => state.role);
  const optional = useDemoStore((state) => state.showOptional);
  const workspaces = useDemoStore((state) => state.workspaces);
  const orgName = useDemoStore((state) => state.orgName);
  const profileName = useDemoStore((state) => state.profileName);
  const workspaceName = useDemoStore((state) => state.workspaceName) ?? t("My workspace");
  const initials = profileName
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  let links = personalLinks.map((item) => ({ ...item, path: `/${item.path}` }));
  if (context.org)
    links = (context.workspace ? workspaceLinks : orgLinks)
      .filter((item) => {
        if (["billing", "invoices"].includes(item.path)) return canViewBilling(role);
        if (["audit", "settings", "guardrails"].includes(item.path)) return canManage(role);
        return true;
      })
      .map((item) => ({ ...item, path: `${context.base}/${item.path}` }));
  const value = context.org ? context.base : "/console";
  return (
    <aside className="sidebar">
      <Brand />
      <div className="context-switch">
        <small>{t("Current workspace")}</small>
        <Select
          label="Switch workspace"
          value={value}
          onChange={(base) => {
            void navigate({
              to: "/$",
              params: { _splat: base === "/console" ? "console" : `${base.slice(1)}/console` },
            });
            props.onNavigate?.();
          }}
          options={[
            { value: "/console", label: workspaceName, localizeLabel: false },
            { value: "/o/studio", label: orgName, localizeLabel: false },
            ...workspaces.map((item) => ({
              value: `/o/studio/w/${item.id}`,
              label: item.name,
              localizeLabel: false,
            })),
          ]}
          className="w-full"
        />
      </div>
      <div className="sidebar-scroll">
        <p className="nav-group-label">{t(context.org ? "Team workspace" : "Workspace")}</p>
        <nav aria-label={t("Workspace navigation")}>
          {links.map((item) => {
            const Icon = icons[item.icon] ?? LayoutDashboard;
            return (
              <AppLink
                key={item.path}
                to={item.path}
                className={`sidebar-link ${props.path === item.path ? "active" : ""}`}
                aria-current={props.path === item.path ? "page" : undefined}
                onClick={props.onNavigate}
              >
                <Icon aria-hidden="true" />
                {t(item.label)}
              </AppLink>
            );
          })}
          <AppLink
            to="/o"
            className={`sidebar-link ${props.path === "/o" ? "active" : ""}`}
            aria-current={props.path === "/o" ? "page" : undefined}
            onClick={props.onNavigate}
          >
            <Building2 aria-hidden="true" />
            {t("My organizations")}
          </AppLink>
        </nav>
        {!context.org && (
          <>
            <p className="nav-group-label">{t("Account")}</p>
            {personalSettings.map((item) => {
              const Icon = icons[item.icon];
              return (
                <AppLink
                  key={item.path}
                  to={`/${item.path}`}
                  className={`sidebar-link ${props.path === `/${item.path}` ? "active" : ""}`}
                  aria-current={props.path === `/${item.path}` ? "page" : undefined}
                  onClick={props.onNavigate}
                >
                  <Icon aria-hidden="true" />
                  {t(item.label)}
                </AppLink>
              );
            })}
          </>
        )}
        {optional && (
          <>
            <p className="nav-group-label">{t("Optional concepts")}</p>
            {Object.entries(optionalLabels).map(([path, label]) => (
              <AppLink
                key={path}
                to={`/console/${path}`}
                className={`sidebar-link ${props.path === `/console/${path}` ? "active" : ""}`}
                aria-current={props.path === `/console/${path}` ? "page" : undefined}
                onClick={props.onNavigate}
              >
                {t(label)}
              </AppLink>
            ))}
            <AppLink to="/rankings" className="sidebar-link" onClick={props.onNavigate}>
              {t("Rankings")}
            </AppLink>
          </>
        )}
      </div>
      <div className="sidebar-bottom">
        <AppLink to="/docs" className="sidebar-link mb-4" onClick={props.onNavigate}>
          <FileText aria-hidden="true" />
          {t("Help & documentation")}
          <ArrowUpRight className="ml-auto" aria-hidden="true" />
        </AppLink>
        <AppLink
          to="/console/profile"
          className="flex gap-3 items-center px-2"
          onClick={props.onNavigate}
        >
          <span className="user-avatar">{initials}</span>
          <span className="text-xs font-medium">
            {profileName}
            <small className="block font-normal text-muted-foreground mt-1">
              {t(role)} · {t("Demo account")}
            </small>
          </span>
        </AppLink>
      </div>
    </aside>
  );
}
