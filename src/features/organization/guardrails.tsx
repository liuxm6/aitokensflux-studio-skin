import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeading, StaticDataTable, DemoNotice } from "@/components/primitives";
import {
  canManage,
  createDemoId,
  isDemoWorkspaceMember,
  useDemoStore,
  type DemoRule,
} from "@/demo/store";

export function GuardrailsPage(props: { workspace: string }) {
  const { t } = useTranslation();
  const allRules = useDemoStore((state) => state.rules);
  const members = useDemoStore((state) => state.members);
  const keys = useDemoStore((state) => state.keys);
  const role = useDemoStore((state) => state.role);
  const [editing, setEditing] = useState<DemoRule | "new" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const allowed = canManage(role);
  const rules = allRules.filter((rule) => rule.workspace === props.workspace);
  const targets = [
    { value: "workspace", label: "Workspace" },
    ...members
      .filter(
        (member) => isDemoWorkspaceMember(member, props.workspace) && member.status === "Active",
      )
      .map((member) => ({ value: `member:${member.id}`, label: `${t("Member")}: ${member.name}` })),
    ...keys
      .filter((key) => key.scope === `studio/${props.workspace}`)
      .map((key) => ({ value: `key:${key.id}`, label: `${t("API key")}: ${key.name}` })),
  ];
  let currentTarget = "workspace";
  if (editing && editing !== "new" && editing.targetId) {
    const prefix = editing.target === "Member" ? "member" : "key";
    currentTarget = `${prefix}:${editing.targetId}`;
  }
  return (
    <>
      <PageHeading
        title="Freedom, with a few good boundaries."
        description="Make model access intentional for your workspace, members and keys."
        action={
          <Button onClick={() => setEditing("new")} disabled={!allowed}>
            <Plus size={16} aria-hidden="true" />
            {t("Add a rule")}
          </Button>
        }
      />
      <div className="panel flex items-start gap-4 mb-6">
        <span className="feature-icon">
          <ShieldCheck aria-hidden="true" />
        </span>
        <div>
          <h3 className="!text-sm">{t("Organization rules are inherited")}</h3>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("Workspace rules can narrow access, but cannot override organization restrictions.")}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("This editor changes demo rules only. No provider policy is enforced.")}
          </p>
        </div>
      </div>
      <StaticDataTable
        label="Guardrails"
        data={rules}
        columns={[
          { id: "name", label: "Rule", cell: (rule) => rule.name },
          {
            id: "target",
            label: "Applies to",
            cell: (rule) => {
              let label = t("Workspace");
              if (rule.target === "Member")
                label =
                  members.find((member) => member.id === rule.targetId)?.name ??
                  rule.targetId ??
                  t("Member");
              if (rule.target === "API key")
                label =
                  keys.find((key) => key.id === rule.targetId)?.name ??
                  rule.targetId ??
                  t("API key");
              return <span className="tag">{label}</span>;
            },
          },
          {
            id: "models",
            label: "Allowed models",
            cell: (rule) =>
              rule.model || <span className="text-destructive">{t("No models allowed")}</span>,
          },
          {
            id: "actions",
            label: "Actions",
            cell: (rule) => (
              <div className="flex gap-2">
                <Button variant="ghost" disabled={!allowed} onClick={() => setEditing(rule)}>
                  {t("Edit")}
                </Button>
                <Button variant="ghost" disabled={!allowed} onClick={() => setDeleting(rule.id)}>
                  {t("Delete")}
                </Button>
              </div>
            ),
          },
        ]}
      />
      <p className="text-xs text-muted-foreground mt-5">
        {t("An empty allow list blocks all models. It does not mean unrestricted access.")}
      </p>
      {editing && (
        <FormDialog
          title={editing === "new" ? "Add a rule" : "Edit rule"}
          disabled={!allowed}
          fields={[
            { name: "name", label: "Rule name", value: editing === "new" ? "" : editing.name },
            { name: "target", label: "Applies to", options: targets, value: currentTarget },
            {
              name: "model",
              label: "Allowed models",
              value: editing === "new" ? "GPT-4.1" : editing.model,
              autoComplete: "off",
              spellCheck: false,
              optional: true,
              hint: "An empty allow list blocks all models. It does not mean unrestricted access.",
            },
          ]}
          onClose={() => setEditing(null)}
          onSave={(values) => {
            const [kind, targetId] = values.target.split(":");
            let target = "Workspace";
            if (kind === "member") target = "Member";
            if (kind === "key") target = "API key";
            const rule: DemoRule = {
              id: editing === "new" ? createDemoId("rule") : editing.id,
              name: values.name,
              workspace: props.workspace,
              target,
              targetId,
              model: values.model,
            };
            useDemoStore.setState({
              rules:
                editing === "new"
                  ? [...allRules, rule]
                  : allRules.map((item) => (item.id === rule.id ? rule : item)),
            });
            toast.success(t("Demo rule saved"));
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={t("Delete this demo rule?")}
        desc={t("This only changes the current preview.")}
        destructive
        disabled={!allowed}
        confirmText={t("Delete rule")}
        handleConfirm={() => {
          if (!allowed) return;
          useDemoStore.setState({ rules: allRules.filter((rule) => rule.id !== deleting) });
          setDeleting(null);
        }}
      />
      <div className="mt-5">
        <DemoNotice />
      </div>
    </>
  );
}
