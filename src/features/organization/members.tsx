import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, MoreHorizontal, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormDialog, type DemoField } from "@/components/form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeading, StaticDataTable, Status, Select } from "@/components/primitives";
import {
  canManage,
  createDemoId,
  demoWorkspaceRole,
  isDemoWorkspaceMember,
  useDemoStore,
} from "@/demo/store";
import type { DemoMember } from "@/demo/fixtures";
import { formatMoney, toIntlLocale } from "@/lib/format";

export function MembersPage(props: { workspace?: string }) {
  const { t, i18n } = useTranslation();
  const members = useDemoStore((state) => state.members);
  const role = useDemoStore((state) => state.role);
  const addMember = useDemoStore((state) => state.addMember);
  const updateMember = useDemoStore((state) => state.updateMember);
  const removeMember = useDemoStore((state) => state.removeMember);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<DemoMember | "new" | null>(null);
  const [deleting, setDeleting] = useState<DemoMember | null>(null);
  const locale = toIntlLocale(i18n.language);
  const allowed = canManage(role);
  const scopedMembers = members.filter(
    (member) => !props.workspace || isDemoWorkspaceMember(member, props.workspace),
  );
  const visible = scopedMembers.filter((member) => {
    const displayedRole = props.workspace
      ? demoWorkspaceRole(member, props.workspace)
      : member.role;
    return (
      `${member.name} ${member.email}`.toLowerCase().includes(query.trim().toLowerCase()) &&
      (filter === "all" || displayedRole === filter)
    );
  });
  const eligible = members.filter(
    (member) =>
      member.status === "Active" &&
      props.workspace &&
      !isDemoWorkspaceMember(member, props.workspace),
  );
  const roles = props.workspace ? ["admin", "member", "auditor"] : ["admin", "billing", "member"];
  const filterRoles = props.workspace ? ["all", ...roles] : ["all", "owner", ...roles];
  const canAdd = allowed && (props.workspace ? eligible.length > 0 : members.length < 10);
  let fields: DemoField[] = [];
  if (editing) {
    if (props.workspace) {
      fields = [
        {
          name: "member",
          label: "Member",
          options: (editing === "new" ? eligible : [editing]).map((member) => ({
            value: member.id,
            label: `${member.name} (${member.email})`,
          })),
          value: editing === "new" ? "" : editing.id,
        },
        {
          name: "role",
          label: "Workspace role",
          options: roles,
          value: editing === "new" ? "member" : demoWorkspaceRole(editing, props.workspace),
        },
      ];
    } else {
      fields = [
        { name: "name", label: "Name", value: editing === "new" ? "" : editing.name },
        {
          name: "email",
          label: "Email",
          type: "email",
          autoComplete: "email",
          spellCheck: false,
          value: editing === "new" ? "" : editing.email,
        },
        {
          name: "role",
          label: "Role",
          options: roles,
          value: editing === "new" ? "member" : editing.role,
        },
        {
          name: "budget",
          label: "Budget in USD",
          type: "number",
          value: editing === "new" ? "100" : String(editing.budget),
        },
      ];
    }
  }
  let formTitle = "Edit member";
  let submitLabel = "Save changes";
  if (editing === "new") {
    formTitle = props.workspace ? "Add member" : "Invite member";
    submitLabel = props.workspace ? "Add member" : "Create demo invitation";
  }

  return (
    <>
      <PageHeading
        title="Members and permissions"
        description="The right access for everyone. A little less friction for your team."
        action={
          <Button onClick={() => setEditing("new")} disabled={!canAdd}>
            <Plus size={16} aria-hidden="true" />
            {t(props.workspace ? "Add member" : "Invite member")}
          </Button>
        }
      />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="tag accent">
          {props.workspace
            ? t("{{count}} members", { count: scopedMembers.length })
            : t("{{count}} of {{total}} seats used", { count: members.length, total: 10 })}
        </span>
        <span className="text-xs text-muted-foreground">
          {t(
            props.workspace
              ? "Organization owners and admins keep workspace administrator access."
              : "Invitations are simulated. No email will be sent.",
          )}
        </span>
      </div>
      <div className="toolbar">
        <div className="search-field">
          <Search aria-hidden="true" />
          <Input
            aria-label={t("Search members")}
            placeholder={t("Search by name or email…")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Select
          label="Member role"
          value={filter}
          onChange={setFilter}
          options={filterRoles.map((value) => ({
            value,
            label: value === "all" ? "All roles" : value,
          }))}
        />
      </div>
      <StaticDataTable
        label="Members"
        data={visible}
        columns={[
          {
            id: "name",
            label: "Member",
            cell: (member) => (
              <div className="flex items-center gap-3">
                <span className="user-avatar">
                  {member.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <div>
                  {member.name}
                  <small className="block text-xs text-muted-foreground">{member.email}</small>
                </div>
              </div>
            ),
          },
          {
            id: "role",
            label: "Role",
            cell: (member) => (
              <span className="tag">
                {t(props.workspace ? demoWorkspaceRole(member, props.workspace) : member.role)}
              </span>
            ),
          },
          { id: "status", label: "Status", cell: (member) => <Status value={member.status} /> },
          {
            id: "budget",
            label: props.workspace ? "Organization budget" : "Member budget",
            cell: (member) => formatMoney(member.budget, locale),
          },
          {
            id: "actions",
            label: "Actions",
            cell: (member) => {
              const inherited =
                !!props.workspace && (member.role === "owner" || member.role === "admin");
              const disabled = !allowed || member.role === "owner" || inherited;
              return (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    className="icon-button"
                    disabled={disabled}
                    aria-label={t("Edit {{name}}", { name: member.name })}
                    onClick={() => setEditing(member)}
                  >
                    <MoreHorizontal size={17} aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" disabled={disabled} onClick={() => setDeleting(member)}>
                    {t(member.status === "Invited" ? "Revoke" : "Remove")}
                  </Button>
                </div>
              );
            },
          },
        ]}
      />
      <div className="panel flex items-center gap-4 mt-6">
        <Mail className="text-primary shrink-0" size={22} aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          {t(
            props.workspace
              ? "Member budgets are managed at the organization level, across workspaces."
              : "Invite colleagues with the access they need. Organization owners retain full control.",
          )}
        </p>
      </div>
      {editing && (
        <FormDialog
          title={formTitle}
          disabled={!allowed}
          submitLabel={submitLabel}
          fields={fields}
          onClose={() => setEditing(null)}
          validate={(values) => {
            const errors: Record<string, string> = {};
            if (
              !props.workspace &&
              members.some(
                (member) =>
                  member.id !== (editing === "new" ? "" : editing.id) &&
                  member.email.toLowerCase() === values.email?.trim().toLowerCase(),
              )
            )
              errors.email = "A member with this email already exists.";
            if (!props.workspace && editing === "new" && members.length >= 10)
              errors.email = "No demo seats are available.";
            return errors;
          }}
          onSave={(values) => {
            if (props.workspace) {
              const selected = members.find((member) => member.id === values.member);
              if (!selected) return false;
              updateMember(selected.id, {
                workspaces: [
                  ...new Set([...(selected.workspaces ?? [selected.workspace]), props.workspace]),
                ],
                workspaceRoles: { ...selected.workspaceRoles, [props.workspace]: values.role },
              });
            } else if (editing === "new") {
              addMember({
                id: createDemoId("member"),
                name: values.name,
                email: values.email,
                role: values.role,
                status: "Invited",
                budget: Number(values.budget),
                workspace: "",
              });
            } else {
              updateMember(editing.id, {
                name: values.name,
                email: values.email,
                role: values.role,
                budget: Number(values.budget),
              });
            }
            toast.success(t("Demo member saved"));
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        disabled={!allowed}
        title={t("Remove this demo member?")}
        desc={t("Only this preview is affected. No real organization membership will change.")}
        confirmText={t("Remove member")}
        destructive
        handleConfirm={() => {
          if (!allowed || !deleting) return;
          if (props.workspace) {
            const workspaceRoles = { ...deleting.workspaceRoles };
            delete workspaceRoles[props.workspace];
            updateMember(deleting.id, {
              workspaces: (deleting.workspaces ?? [deleting.workspace]).filter(
                (id) => id !== props.workspace,
              ),
              workspaceRoles,
            });
          } else removeMember(deleting.id);
          setDeleting(null);
          toast.success(t("Demo member removed"));
        }}
      />
    </>
  );
}
