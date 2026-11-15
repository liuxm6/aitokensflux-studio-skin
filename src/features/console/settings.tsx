import { useState } from "react";
import { useNavigate, useRouterState, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Shield, Monitor, Moon, Sun, Pencil, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormDialog, type DemoField } from "@/components/form-dialog";
import { CopyButton } from "@/components/copy-button";
import { PageHeading, AppLink, Select, DemoNotice } from "@/components/primitives";
import { canManage, createDemoId, useDemoStore, type Theme } from "@/demo/store";
import { personalSettings } from "@/demo/navigation";
import { mergeRouteSearch, readEnum, type RouteSearch } from "@/lib/route-search";
import { KeysPage } from "./keys";
import { SectionTabs } from "@/components/section-tabs";

export function SettingsPage(props: { section: string; org: boolean; workspace?: string }) {
  const { t } = useTranslation();
  const theme = useDemoStore((state) => state.theme);
  const language = useDemoStore((state) => state.language);
  const notices = useDemoStore((state) => state.notices);
  const workspaceName = useDemoStore((state) => state.workspaceName) ?? t("My workspace");
  const workspaces = useDemoStore((state) => state.workspaces);
  const role = useDemoStore((state) => state.role);
  const setPreference = useDemoStore((state) => state.setPreference);
  const navigate = useNavigate();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const search = useSearch({ strict: false }) as RouteSearch;
  const [edit, setEdit] = useState<string | null>(null);
  const [danger, setDanger] = useState<string | null>(null);
  const orgName = useDemoStore((state) => state.orgName);
  const profileName = useDemoStore((state) => state.profileName);
  const sso = useDemoStore((state) => state.sso);
  const scim = useDemoStore((state) => state.scim);
  const allowed = !props.org || canManage(role);
  const workspace = workspaces.find((item) => item.id === props.workspace);
  const availableTabs = ["General", "Management keys", "SSO & SCIM", "Danger zone"].filter(
    (item) => !props.workspace || item === "General" || item === "Danger zone",
  );
  const tab = props.org ? readEnum(search.tab, availableTabs, "General") : "General";
  const changeTab = (value: string) => {
    void navigate({
      to: "/$",
      params: { _splat: path.slice(1) },
      search: mergeRouteSearch(search, { tab: value === "General" ? undefined : value }),
      replace: false,
    });
  };
  const isGeneral = props.section === "settings" && (!props.org || tab === "General");
  let title = props.org && !props.workspace ? "Organization settings" : "Workspace settings";
  if (props.section === "profile") title = "Profile";
  if (props.section === "notifications") title = "Notifications";
  if (props.section === "privacy") title = "Privacy";
  if (props.section === "preferences") title = "Preferences";
  let fields: DemoField[] = [{ name: "name", label: "Name", value: workspaceName }];
  if (edit === "Edit profile")
    fields = [{ name: "name", label: "Display name", value: profileName }];
  if (edit === "Edit organization")
    fields = [{ name: "name", label: "Organization name", value: orgName }];
  if (edit === "Edit workspace")
    fields = [{ name: "name", label: "Workspace name", value: workspace?.name ?? workspaceName }];
  if (edit === "Configure SSO")
    fields = [
      {
        name: "issuer",
        label: "Issuer URL",
        type: "url",
        autoComplete: "url",
        spellCheck: false,
        value: sso.issuer || "https://identity.example.test",
        hint: "Example values only. No identity provider is contacted.",
      },
      {
        name: "client",
        label: "Client ID",
        autoComplete: "off",
        spellCheck: false,
        value: sso.client || "demo-client",
      },
    ];
  if (edit === "Configure SCIM")
    fields = [
      {
        name: "group",
        label: "Identity provider group",
        autoComplete: "off",
        spellCheck: false,
        value: scim.group || "engineering",
      },
      {
        name: "role",
        label: "Workspace role",
        options: ["admin", "member", "auditor"],
        value: scim.role,
      },
    ];
  if (edit === "Create workspace") fields = [{ name: "name", label: "Workspace name" }];
  return (
    <>
      <PageHeading
        title={title}
        description="Thoughtful defaults. Simple controls. Everything in its place."
      />
      <SectionTabs
        hideTabs={!props.org}
        label="Organization settings"
        value={tab}
        onChange={changeTab}
        options={availableTabs}
      >
        {props.org && tab === "Management keys" ? (
          <KeysPage scope="management" management />
        ) : (
          <div className={props.org ? "" : "settings-layout"}>
            {!props.org && (
              <nav className="settings-nav" aria-label={t("Personal settings")}>
                {personalSettings.map((item) => (
                  <AppLink
                    to={`/${item.path}`}
                    key={item.path}
                    className={`sidebar-link ${item.path.endsWith(props.section) ? "active" : ""}`}
                    aria-current={item.path.endsWith(props.section) ? "page" : undefined}
                  >
                    {t(item.label)}
                  </AppLink>
                ))}
              </nav>
            )}
            <div className="settings-body">
              <div className="panel">
                {isGeneral && (
                  <>
                    <h2 className="!text-lg mb-2">{t("General information")}</h2>
                    <div className="setting-row">
                      <div>
                        <h3>
                          {t(
                            props.org && !props.workspace ? "Organization name" : "Workspace name",
                          )}
                        </h3>
                        <p>
                          {props.org && !props.workspace
                            ? orgName
                            : (workspace?.name ?? workspaceName)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        disabled={!allowed}
                        onClick={() =>
                          setEdit(
                            props.org && !props.workspace ? "Edit organization" : "Edit workspace",
                          )
                        }
                      >
                        <Pencil size={14} aria-hidden="true" />
                        {t("Edit")}
                      </Button>
                    </div>
                    {props.org && !props.workspace && (
                      <div className="setting-row">
                        <div>
                          <h3>{t("Workspaces")}</h3>
                          <p>{t("Separate projects without separating your team.")}</p>
                        </div>
                        <Button
                          variant="outline"
                          disabled={!allowed}
                          onClick={() => setEdit("Create workspace")}
                        >
                          {t("Create workspace")}
                        </Button>
                      </div>
                    )}
                    {props.workspace && (
                      <div className="setting-row">
                        <div>
                          <h3>{t("Workspace status")}</h3>
                          <p>{t("Pause access while keeping your configuration intact.")}</p>
                        </div>
                        <Button
                          variant="outline"
                          disabled={!allowed}
                          onClick={() => {
                            useDemoStore.setState({
                              workspaces: workspaces.map((item) =>
                                item.id === props.workspace
                                  ? { ...item, paused: !item.paused }
                                  : item,
                              ),
                            });
                            toast.success(t("Demo workspace updated"));
                          }}
                        >
                          {t(workspace?.paused ? "Resume workspace" : "Pause workspace")}
                        </Button>
                      </div>
                    )}
                    {!props.org && (
                      <PreferenceRow
                        title="Automatic fallback"
                        description="A local preview preference. Live routing is not configured."
                        checked={notices["Automatic fallback"]}
                        onChange={(checked) =>
                          useDemoStore.setState({
                            notices: { ...notices, "Automatic fallback": checked },
                          })
                        }
                      />
                    )}
                  </>
                )}
                {props.section === "profile" && (
                  <>
                    <div className="flex items-center gap-4 mb-5">
                      <span className="user-avatar !w-16 !h-16 !text-lg">
                        {profileName
                          .trim()
                          .split(/\s+/)
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <div>
                        <h2 className="!text-lg">{profileName}</h2>
                        <p className="text-sm text-muted-foreground">alex@example.test</p>
                      </div>
                    </div>
                    <div className="setting-row">
                      <div>
                        <h3>{t("Display name")}</h3>
                        <p>{profileName}</p>
                      </div>
                      <Button variant="outline" onClick={() => setEdit("Edit profile")}>
                        {t("Edit")}
                      </Button>
                    </div>
                    <div className="setting-row">
                      <div>
                        <h3>{t("User ID")}</h3>
                        <p>demo-user-001</p>
                      </div>
                      <CopyButton value="demo-user-001" aria-label={t("Copy user ID")} />
                    </div>
                    <div className="setting-row">
                      <div>
                        <h3>{t("Account group")}</h3>
                        <p>{t("Personal")}</p>
                      </div>
                      <span className="tag">{t("Demo account")}</span>
                    </div>
                  </>
                )}
                {props.section === "notifications" && (
                  <>
                    <h2 className="!text-lg mb-2">{t("Keep the signal. Skip the noise.")}</h2>
                    <PreferenceRow
                      title="Usage alerts"
                      description="Get a heads-up before reaching your budget."
                      checked={notices["Usage alerts"]}
                      onChange={(checked) =>
                        useDemoStore.setState({ notices: { ...notices, "Usage alerts": checked } })
                      }
                    />
                    <PreferenceRow
                      title="Product updates"
                      description="Occasional news about models and new possibilities."
                      checked={notices["Product updates"]}
                      onChange={(checked) =>
                        useDemoStore.setState({
                          notices: { ...notices, "Product updates": checked },
                        })
                      }
                    />
                  </>
                )}
                {props.section === "privacy" && (
                  <>
                    <span className="feature-icon mb-4">
                      <Shield aria-hidden="true" />
                    </span>
                    <h2 className="!text-lg mb-2">{t("Privacy, by intention")}</h2>
                    {["Zero data retention", "Allow training"].map((label) => (
                      <PreferenceRow
                        key={label}
                        title={label}
                        description="This switch is a local preference preview, not an enforced provider policy."
                        checked={notices[label]}
                        onChange={(checked) =>
                          useDemoStore.setState({ notices: { ...notices, [label]: checked } })
                        }
                      />
                    ))}
                  </>
                )}
                {props.section === "preferences" && (
                  <>
                    <h2 className="!text-lg mb-6">{t("Appearance")}</h2>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: "light", label: "Light", icon: Sun },
                        { value: "dark", label: "Dark", icon: Moon },
                        { value: "system", label: "System", icon: Monitor },
                      ].map((item) => (
                        <Button
                          key={item.value}
                          variant={theme === item.value ? "secondary" : "outline"}
                          className="!flex-col !h-24 !gap-3"
                          aria-pressed={theme === item.value}
                          onClick={() => setPreference({ theme: item.value as Theme })}
                        >
                          <item.icon size={22} aria-hidden="true" />
                          {t(item.label)}
                        </Button>
                      ))}
                    </div>
                    <div className="setting-row mt-4">
                      <div>
                        <h3>{t("Interface language")}</h3>
                        <p>{t("A familiar language for your everyday work.")}</p>
                      </div>
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
                      />
                    </div>
                  </>
                )}
                {props.org && tab === "SSO & SCIM" && (
                  <>
                    <span className="feature-icon mb-4">
                      <LockKeyhole aria-hidden="true" />
                    </span>
                    <h2 className="!text-lg mb-4">{t("Identity that fits your organization")}</h2>
                    <div className="setting-row">
                      <div>
                        <h3>{t("Single sign-on")}</h3>
                        <p>{sso.issuer || t("Preview an OpenID Connect configuration.")}</p>
                      </div>
                      <Button
                        variant="outline"
                        disabled={role !== "owner"}
                        onClick={() => setEdit("Configure SSO")}
                      >
                        {t("Configure")}
                      </Button>
                    </div>
                    <div className="setting-row">
                      <div>
                        <h3>{t("Directory provisioning")}</h3>
                        <p>
                          {scim.group
                            ? `${scim.group} → ${t(scim.role)}`
                            : t("Map identity provider groups to workspace roles.")}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        disabled={role !== "owner"}
                        onClick={() => setEdit("Configure SCIM")}
                      >
                        {t("Configure")}
                      </Button>
                    </div>
                    <DemoNotice />
                  </>
                )}
                {props.org && tab === "Danger zone" && (
                  <>
                    <h2 className="!text-lg">{t("Handle with care")}</h2>
                    <p className="text-sm text-muted-foreground mt-3 mb-4">
                      {t(
                        "Sensitive actions require fresh authentication in the live product. This is only a preview.",
                      )}
                    </p>
                    {!props.workspace && (
                      <div className="setting-row">
                        <div>
                          <h3>{t("Transfer ownership")}</h3>
                          <p>{t("Only the organization owner can transfer ownership.")}</p>
                        </div>
                        <Button
                          variant="outline"
                          disabled={role !== "owner"}
                          onClick={() => setDanger("Transfer ownership")}
                        >
                          {t("Review transfer")}
                        </Button>
                      </div>
                    )}
                    <div className="setting-row">
                      <div>
                        <h3>{t(props.workspace ? "Delete workspace" : "Delete organization")}</h3>
                        <p>
                          {t(
                            props.workspace === "default"
                              ? "The default workspace cannot be deleted."
                              : "Review the consequences before continuing.",
                          )}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        disabled={props.workspace === "default" || role !== "owner"}
                        onClick={() =>
                          setDanger(props.workspace ? "Delete workspace" : "Delete organization")
                        }
                      >
                        {t("Review deletion")}
                      </Button>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-5">
                <DemoNotice>
                  {t("Preferences in this preview do not change your live account.")}
                </DemoNotice>
              </div>
            </div>
          </div>
        )}
      </SectionTabs>
      {edit && (
        <FormDialog
          title={edit}
          disabled={
            edit === "Configure SSO" || edit === "Configure SCIM" ? role !== "owner" : !allowed
          }
          fields={fields}
          onClose={() => setEdit(null)}
          onSave={(values) => {
            if (edit === "Edit profile")
              useDemoStore.setState((state) => ({
                profileName: values.name,
                members: state.members.map((member) =>
                  member.id === "m1" ? { ...member, name: values.name } : member,
                ),
              }));
            if (edit === "Edit organization") useDemoStore.setState({ orgName: values.name });
            if (edit === "Edit workspace") {
              if (props.workspace)
                useDemoStore.setState({
                  workspaces: workspaces.map((item) =>
                    item.id === props.workspace ? { ...item, name: values.name } : item,
                  ),
                });
              else useDemoStore.setState({ workspaceName: values.name });
            }
            if (edit === "Configure SSO")
              useDemoStore.setState({ sso: { issuer: values.issuer, client: values.client } });
            if (edit === "Configure SCIM")
              useDemoStore.setState({ scim: { group: values.group, role: values.role } });
            if (edit === "Create workspace")
              useDemoStore.setState({
                workspaces: [
                  ...workspaces,
                  {
                    id: createDemoId("workspace"),
                    name: values.name,
                    paused: false,
                  },
                ],
              });
            toast.success(t("Saved in this preview"));
          }}
        />
      )}
      <ConfirmDialog
        open={!!danger}
        onOpenChange={(open) => {
          if (!open) setDanger(null);
        }}
        title={t(danger ?? "Confirm")}
        desc={t(
          "This previews the confirmation step only. No ownership or production data will change.",
        )}
        confirmText={t("Confirm simulation")}
        destructive
        disabled={role !== "owner"}
        handleConfirm={() => {
          setDanger(null);
          toast.success(t("Confirmation preview complete. No live change was made."));
        }}
      />
    </>
  );
}

function PreferenceRow(props: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="setting-row">
      <div>
        <h3>{t(props.title)}</h3>
        <p>{t(props.description)}</p>
      </div>
      <Switch
        aria-label={t(props.title)}
        checked={props.checked}
        onCheckedChange={props.onChange}
      />
    </div>
  );
}
