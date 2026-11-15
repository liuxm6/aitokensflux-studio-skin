import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, KeyRound, MoreHorizontal, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CopyButton } from "@/components/copy-button";
import { FormDialog } from "@/components/form-dialog";
import { PageHeading, StaticDataTable, Status, Select } from "@/components/primitives";
import { canManage, createDemoId, useDemoStore } from "@/demo/store";
import type { DemoKey } from "@/demo/fixtures";
import { formatDate, formatMoney, toIntlLocale } from "@/lib/format";

export function KeysPage(props: { scope: string; management?: boolean }) {
  const { t, i18n } = useTranslation();
  const keys = useDemoStore((state) => state.keys);
  const role = useDemoStore((state) => state.role);
  const addKey = useDemoStore((state) => state.addKey);
  const updateKey = useDemoStore((state) => state.updateKey);
  const deleteKey = useDemoStore((state) => state.deleteKey);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<DemoKey | "new" | null>(null);
  const [selected, setSelected] = useState<DemoKey | null>(null);
  const [deleting, setDeleting] = useState<DemoKey | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const locale = toIntlLocale(i18n.language);
  const allowed = props.management
    ? role === "owner"
    : props.scope === "personal" || canManage(role);
  const visible = keys.filter(
    (key) =>
      key.scope === props.scope &&
      key.name.toLowerCase().includes(query.toLowerCase()) &&
      (filter === "all" || String(key.active) === filter),
  );
  const title = props.management ? "Management keys" : "API keys";
  const defaultKind = props.scope === "personal" ? "Personal key" : "Member key";
  return (
    <>
      <PageHeading
        title={title}
        level={props.management ? 2 : 1}
        description="Small keys. Big possibilities. Keep your access organized."
        action={
          <Button onClick={() => setEditing("new")} disabled={!allowed}>
            <Plus size={16} aria-hidden="true" />
            {t("Create a key")}
          </Button>
        }
      />
      <div className="panel mb-6 flex items-start gap-4">
        <span className="feature-icon">
          <ShieldCheck aria-hidden="true" />
        </span>
        <div>
          <h3 className="!text-sm">{t("A little care goes a long way")}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {t("Keep keys private, set a budget, and give each application its own key.")}
          </p>
        </div>
        <span className="tag accent ml-auto shrink-0">{t("Demo only")}</span>
      </div>
      <div className="toolbar">
        <div className="search-field">
          <Search aria-hidden="true" />
          <Input
            aria-label={t("Search API keys")}
            placeholder={t("Search by name…")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Select
          label="Key status"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All statuses" },
            { value: "true", label: "Active" },
            { value: "false", label: "Disabled" },
          ]}
        />
      </div>
      <StaticDataTable
        label={title}
        data={visible}
        columns={[
          {
            id: "name",
            label: "Name",
            cell: (key: DemoKey) => (
              <div className="flex items-center gap-3">
                <span className="feature-icon !p-2">
                  <KeyRound size={16} aria-hidden="true" />
                </span>
                <div className="text-sm font-medium">
                  {key.name}
                  <small className="block text-xs text-muted-foreground !font-normal">
                    {t(key.kind)}
                  </small>
                </div>
              </div>
            ),
          },
          {
            id: "key",
            label: "Key",
            cell: (key: DemoKey) => (
              <code className="text-xs text-muted-foreground">
                demo_••••{key.maskedSuffix ?? key.id.slice(-4)}
              </code>
            ),
          },
          {
            id: "status",
            label: "Status",
            cell: (key: DemoKey) => <Status value={key.active ? "Active" : "Disabled"} />,
          },
          {
            id: "budget",
            label: "Budget / used",
            cell: (key: DemoKey) => (
              <div>
                {formatMoney(key.budget, locale)}
                <small className="block text-xs text-muted-foreground">
                  {formatMoney(key.used, locale)} {t("used")}
                </small>
              </div>
            ),
          },
          {
            id: "created",
            label: "Created",
            cell: (key: DemoKey) => (
              <span className="text-xs text-muted-foreground">
                {formatDate(key.created, locale)}
              </span>
            ),
          },
          {
            id: "actions",
            label: "Actions",
            cell: (key: DemoKey) => (
              <Button
                variant="ghost"
                className="icon-button"
                aria-label={t("Manage {{name}}", { name: key.name })}
                onClick={() => setSelected(key)}
              >
                <MoreHorizontal size={18} aria-hidden="true" />
              </Button>
            ),
          },
        ].filter((column) => !props.management || column.id !== "budget")}
      />
      {!allowed && (
        <p className="text-sm text-muted-foreground mt-6">
          {t("Your demo role has read-only access to these keys.")}
        </p>
      )}
      {editing && (
        <FormDialog
          title={editing === "new" ? "Create a key" : "Edit key"}
          submitLabel={editing === "new" ? "Create a key" : "Save changes"}
          disabled={!allowed}
          onClose={() => setEditing(null)}
          fields={[
            {
              name: "name",
              label: "Key name",
              autoComplete: "off",
              spellCheck: false,
              value: editing === "new" ? "" : editing.name,
            },
            {
              name: "budget",
              label: "Budget in USD",
              hint: "Sample total budget, not a monthly limit. No live spending limit is enforced.",
              type: "number" as const,
              inputMode: "decimal" as const,
              autoComplete: "off",
              value: editing === "new" ? "100" : String(editing.budget),
            },
            {
              name: "kind",
              label: "Key type",
              options: props.scope === "personal" ? ["Personal key"] : ["Member key", "System key"],
              value: editing === "new" ? defaultKind : editing.kind,
            },
          ].filter((field) => {
            if (props.management) return field.name === "name";
            return props.scope !== "personal" || field.name !== "kind";
          })}
          onSave={(values) => {
            if (editing === "new") {
              const id = createDemoId("key");
              addKey({
                id,
                name: values.name,
                scope: props.scope,
                kind: props.management ? "Management key" : (values.kind ?? defaultKind),
                active: true,
                budget: Number(values.budget ?? 0),
                used: 0,
                created: "2026-11-14",
              });
              setSecret(`DEMO_NOT_A_REAL_KEY_${id}`);
            } else
              updateKey(editing.id, {
                name: values.name,
                budget: Number(values.budget ?? 0),
                kind: props.management ? "Management key" : (values.kind ?? defaultKind),
              });
            toast.success(t("Demo key saved"));
          }}
        />
      )}
      {secret && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setSecret(null);
          }}
          title={t("Your demo key is ready")}
          description={t("Shown once. This value cannot authenticate real requests.")}
          contentClassName="sm:max-w-lg"
          footer={<Button onClick={() => setSecret(null)}>{t("I have copied it")}</Button>}
        >
          <div className="flex gap-2 items-center rounded-xl bg-muted p-4">
            <code className="text-xs break-all flex-1">{secret}</code>
            <CopyButton value={secret} aria-label={t("Copy demo key")} />
          </div>
        </Dialog>
      )}
      {selected && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
          title={selected.name}
          description={t("Manage this demo key. No production key will be changed.")}
          contentClassName="sm:max-w-md"
        >
          <div className="grid gap-3">
            <Button
              variant="outline"
              disabled={!allowed}
              onClick={() => {
                setEditing(selected);
                setSelected(null);
              }}
            >
              {t("Edit key")}
            </Button>
            <Button
              variant="outline"
              disabled={!allowed}
              onClick={() => {
                updateKey(selected.id, { active: !selected.active });
                setSelected(null);
                toast.success(t("Key status updated"));
              }}
            >
              {t(selected.active ? "Disable key" : "Enable key")}
            </Button>
            <Button
              variant="outline"
              disabled={!allowed}
              onClick={() => {
                const rotationId = createDemoId("rotation");
                updateKey(selected.id, { maskedSuffix: rotationId.slice(-4) });
                setSecret(`DEMO_ROTATED_${rotationId}`);
                setSelected(null);
                toast.success(t("Demo key rotated"));
              }}
            >
              {t("Rotate key")}
            </Button>
            <Button
              variant="destructive"
              disabled={!allowed}
              onClick={() => {
                setDeleting(selected);
                setSelected(null);
              }}
            >
              {t("Delete key")}
            </Button>
          </div>
        </Dialog>
      )}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={t("Delete this demo key?")}
        desc={t(
          "This removes the key from the current preview. You can reset the demo to restore it.",
        )}
        confirmText={t("Delete key")}
        destructive
        handleConfirm={() => {
          if (deleting) deleteKey(deleting.id);
          setDeleting(null);
          toast.success(t("Demo key deleted"));
        }}
      />
    </>
  );
}
