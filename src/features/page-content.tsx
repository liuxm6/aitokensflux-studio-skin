import { lazy, Suspense } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AlertCircle, LockKeyhole, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLink, EmptyState } from "@/components/primitives";
import { getContext, getPageLabel, isKnownConsolePage } from "@/demo/navigation";
import { optionalPages } from "@/demo/fixtures";
import { canManage, useDemoStore } from "@/demo/store";
import { Home } from "./public/home";

const Catalog = lazy(() =>
  import("./public/catalog").then((module) => ({ default: module.Catalog })),
);
const Discover = lazy(() =>
  import("./public/discover").then((module) => ({ default: module.Discover })),
);
const ModelDetail = lazy(() =>
  import("./public/model-detail").then((module) => ({ default: module.ModelDetail })),
);
const Providers = lazy(() =>
  import("./public/support").then((module) => ({ default: module.ProvidersPage })),
);
const StatusPage = lazy(() =>
  import("./public/support").then((module) => ({ default: module.StatusPage })),
);
const Docs = lazy(() =>
  import("./public/support").then((module) => ({ default: module.DocsPage })),
);
const Rankings = lazy(() =>
  import("./public/support").then((module) => ({ default: module.RankingsPage })),
);
const Dashboard = lazy(() =>
  import("./console/dashboard").then((module) => ({ default: module.Dashboard })),
);
const Keys = lazy(() => import("./console/keys").then((module) => ({ default: module.KeysPage })));
const Activity = lazy(() =>
  import("./console/activity").then((module) => ({ default: module.ActivityPage })),
);
const Billing = lazy(() =>
  import("./console/billing").then((module) => ({ default: module.BillingPage })),
);
const Settings = lazy(() =>
  import("./console/settings").then((module) => ({ default: module.SettingsPage })),
);
const Concept = lazy(() =>
  import("./console/concept").then((module) => ({ default: module.ConceptPage })),
);
const Members = lazy(() =>
  import("./organization/members").then((module) => ({ default: module.MembersPage })),
);
const Guardrails = lazy(() =>
  import("./organization/guardrails").then((module) => ({ default: module.GuardrailsPage })),
);
const Organizations = lazy(() =>
  import("./organization/organizations").then((module) => ({ default: module.OrganizationsPage })),
);
const Invite = lazy(() =>
  import("./organization/organizations").then((module) => ({ default: module.InvitePage })),
);

export function PageContent() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const resetVersion = useDemoStore((state) => state.resetVersion);
  return (
    <Suspense fallback={<LoadingState />}>
      <PageRenderer key={`${path}:${resetVersion}`} path={path} />
    </Suspense>
  );
}

function PageRenderer(props: { path: string }) {
  const { t } = useTranslation();
  const scenario = useDemoStore((state) => state.scenario);
  const role = useDemoStore((state) => state.role);
  const signedIn = useDemoStore((state) => state.signedIn);
  const workspaces = useDemoStore((state) => state.workspaces);
  const context = getContext(props.path);
  const resetScenario = () => useDemoStore.setState({ scenario: "normal" });
  if (scenario === "loading")
    return (
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-2xl font-semibold">{t(getPageLabel(props.path))}</h1>
        <LoadingState />
        <Button className="mt-6" variant="outline" onClick={resetScenario}>
          {t("Show loaded state")}
        </Button>
      </div>
    );
  if (scenario === "empty")
    return (
      <EmptyState
        headingLevel={1}
        title="A fresh space for your next idea"
        description="This is the empty-state preview. Add something or return to the sample data."
        action={<Button onClick={resetScenario}>{t("Show sample data")}</Button>}
      />
    );
  if (scenario !== "normal") {
    const Icon = scenario === "restricted" ? LockKeyhole : AlertCircle;
    const title = {
      error: "Something needs another try.",
      restricted: "Access is restricted",
      paused: "This workspace is paused",
    }[scenario];
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-6">
        <Icon className="text-primary mx-auto mb-6" size={36} aria-hidden="true" />
        <h1 className="text-2xl font-semibold">{t(title)}</h1>
        <p className="text-muted-foreground my-5">
          {t("This state is simulated for design review. Your live account is unaffected.")}
        </p>
        <Button onClick={resetScenario}>{t("Return to normal state")}</Button>
      </div>
    );
  }
  if (context.console && !signedIn)
    return (
      <EmptyState
        headingLevel={1}
        title="Your workspace is waiting"
        description="Sign in with the fixed demo identity. No real account is needed."
        action={
          <Button onClick={() => useDemoStore.setState({ signedIn: true })}>
            {t("Continue with demo account")}
          </Button>
        }
      />
    );
  if (props.path === "/" || props.path === "/home") return <Home />;
  if (props.path === "/models") return <Catalog />;
  if (props.path.startsWith("/models/")) {
    let modelId: string | null;
    try {
      modelId = decodeURIComponent(props.path.slice(8));
    } catch {
      modelId = null;
    }
    if (modelId === null) return <NotFound />;
    return <ModelDetail id={modelId} />;
  }
  if (props.path === "/pricing") return <Catalog pricing />;
  if (props.path === "/discover") return <Discover />;
  if (props.path === "/providers") return <Providers />;
  if (props.path === "/status") return <StatusPage />;
  if (props.path === "/docs") return <Docs />;
  if (props.path === "/rankings") return <Rankings />;
  if (props.path === "/o") return <Organizations />;
  if (props.path.startsWith("/invite/")) return <Invite />;
  if (
    !context.console ||
    !isKnownConsolePage(props.path) ||
    (context.org && props.path.split("/")[2] !== "studio")
  )
    return <NotFound />;
  if (context.workspace && !workspaces.some((workspace) => workspace.id === context.workspaceId))
    return <NotFound />;
  if (
    context.org &&
    ["settings", "guardrails", "audit"].includes(context.section) &&
    !canManage(role)
  )
    return (
      <EmptyState
        headingLevel={1}
        title="Access is restricted"
        description="Your preview role cannot manage this area. Change the role in Preview controls to review it."
      />
    );
  const workspace = workspaces.find((item) => item.id === context.workspaceId);
  if (workspace?.paused && context.section !== "settings")
    return (
      <div className="panel text-center py-12">
        <PauseCircle className="mx-auto text-primary mb-5" size={32} aria-hidden="true" />
        <h1 className="text-2xl font-semibold">{t("This workspace is paused")}</h1>
        <Button
          className="mt-6"
          render={<AppLink to={`${context.base}/settings`} />}
          nativeButton={false}
        >
          {t("Open workspace settings")}
        </Button>
      </div>
    );
  if (context.section === "console")
    return <Dashboard base={context.base} org={context.org} workspace={context.workspace} />;
  if (context.section === "keys")
    return <Keys scope={context.workspace ? `studio/${context.workspaceId}` : "personal"} />;
  if (["activity", "usage", "logs", "audit"].includes(context.section))
    return (
      <Activity
        logs={context.section === "logs" || context.section === "usage"}
        audit={context.section === "audit"}
        scope={context.scope}
      />
    );
  if (["billing", "credits", "invoices"].includes(context.section))
    return <Billing org={context.org} invoices={context.section === "invoices"} />;
  if (context.section === "members" && context.org)
    return <Members workspace={context.workspaceId} />;
  if (context.section === "guardrails" && context.workspace)
    return <Guardrails workspace={context.workspaceId ?? "default"} />;
  if (["settings", "profile", "notifications", "privacy", "preferences"].includes(context.section))
    return <Settings section={context.section} org={context.org} workspace={context.workspaceId} />;
  if (optionalPages.includes(context.section)) return <Concept section={context.section} />;
  return <NotFound />;
}

function LoadingState() {
  const { t } = useTranslation();
  return (
    <div role="status" aria-label={t("Loading preview")} className="space-y-5 p-6">
      <div className="skeleton !h-10 !w-1/2" />
      <div className="grid grid-cols-2 gap-5">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <div className="skeleton !h-60" />
      <span className="sr-only">{t("Loading preview")}</span>
    </div>
  );
}

function NotFound() {
  const { t } = useTranslation();
  return (
    <EmptyState
      headingLevel={1}
      title="This page has not found its place."
      description="The address does not match a screen in this demo."
      action={
        <Button render={<AppLink to="/home" />} nativeButton={false}>
          {t("Back to home")}
        </Button>
      }
    />
  );
}
