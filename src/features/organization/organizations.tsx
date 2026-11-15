import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Building2, ArrowUpRight, Plus, Users, Layers3 } from "lucide-react";
import { toast } from "sonner";
import { PageHeading, AppLink, Status, DemoNotice } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/form-dialog";
import { createDemoId, useDemoStore } from "@/demo/store";

export function OrganizationsPage() {
  const { t } = useTranslation();
  const [create, setCreate] = useState(false);
  const extra = useDemoStore((state) => state.organizations);
  const orgName = useDemoStore((state) => state.orgName);
  const members = useDemoStore((state) => state.members);
  const workspaces = useDemoStore((state) => state.workspaces);
  return (
    <>
      <PageHeading
        title="Better together."
        description="A shared home for your people, projects and ideas."
        action={
          <Button onClick={() => setCreate(true)}>
            <Plus size={16} aria-hidden="true" />
            {t("Create organization")}
          </Button>
        }
      />
      <div className="grid md:grid-cols-2 gap-6">
        <AppLink to="/o/studio/console" className="panel !p-7">
          <div className="flex justify-between items-start">
            <span className="feature-icon !p-4">
              <Building2 size={24} aria-hidden="true" />
            </span>
            <Status value="Active" />
          </div>
          <h2 className="!text-xl mt-6 mb-2">{orgName}</h2>
          <p className="text-sm text-muted-foreground">
            {t("A shared space for ambitious ideas.")}
          </p>
          <div className="mt-7 pt-5 border-t border-border flex items-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <Users size={14} aria-hidden="true" />
              {t("{{count}} members", { count: members.length })}
            </span>
            <span className="flex items-center gap-2">
              <Layers3 size={14} aria-hidden="true" />
              {t("{{count}} workspaces", { count: workspaces.length })}
            </span>
            <ArrowUpRight size={18} className="ml-auto" aria-hidden="true" />
          </div>
        </AppLink>
        {extra.map((organization) => (
          <div key={organization.id} className="panel">
            <span className="feature-icon">
              <Building2 aria-hidden="true" />
            </span>
            <h2 className="!text-xl mt-5">{organization.name}</h2>
            <p className="text-sm text-muted-foreground mt-3">
              {t("Created locally for review. Reset the demo to remove it.")}
            </p>
            <span className="tag accent mt-6">{t("Concept preview")}</span>
          </div>
        ))}
      </div>
      <div className="mt-7">
        <DemoNotice />
      </div>
      {create && (
        <FormDialog
          title="Create organization"
          fields={[{ name: "name", label: "Organization name" }]}
          onClose={() => setCreate(false)}
          onSave={(values) => {
            useDemoStore.setState({
              organizations: [...extra, { id: createDemoId("org"), name: values.name }],
            });
            toast.success(t("Demo organization created"));
          }}
        />
      )}
    </>
  );
}

export function InvitePage() {
  const { t } = useTranslation();
  const accepted = useDemoStore((state) => state.invitationAccepted);
  const orgName = useDemoStore((state) => state.orgName);
  return (
    <div className="container-wide public-page">
      <div className="panel !max-w-lg mx-auto !p-9 text-center">
        <span className="feature-icon !p-4 mx-auto">
          <Users aria-hidden="true" />
        </span>
        <h1 className="text-3xl font-semibold mt-6">
          {t(accepted ? "You are part of the team." : "There is a place for you here.")}
        </h1>
        <p className="mt-5 text-muted-foreground">
          {t(
            accepted
              ? "This invitation was accepted in the demo only."
              : "{{organization}} invited you to collaborate in a shared AI workspace.",
            { organization: orgName },
          )}
        </p>
        {accepted ? (
          <Button className="mt-7" render={<AppLink to="/o/studio/console" />} nativeButton={false}>
            {t("Open organization")}
          </Button>
        ) : (
          <Button
            className="mt-7"
            onClick={() => useDemoStore.setState({ invitationAccepted: true })}
          >
            {t("Accept demo invitation")}
          </Button>
        )}
        <div className="mt-6">
          <DemoNotice />
        </div>
      </div>
    </div>
  );
}
