import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Layers3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeading, StaticDataTable, DemoNotice, EmptyState } from "@/components/primitives";
import { optionalLabels } from "@/demo/fixtures";
import { createDemoId, useDemoStore } from "@/demo/store";

const descriptions: Record<string, string> = {
  files: "A considered home for the files behind your work.",
  guardrails: "Explore personal limits and model access rules.",
  byok: "Bring provider access into one organized space.",
  routing: "Shape how your applications find the right provider.",
  presets: "Keep useful configurations ready for the next idea.",
  tools: "A place for capabilities that extend your workflow.",
  observability: "Connect a clearer view of your application activity.",
};
export function ConceptPage(props: { section: string }) {
  const { t } = useTranslation();
  const enabled = useDemoStore((state) => state.showOptional);
  const [add, setAdd] = useState(false);
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);
  const conceptItems = useDemoStore((state) => state.conceptItems);
  const items = conceptItems[props.section] ?? [];
  const setItems = (next: { id: string; name: string }[]) =>
    useDemoStore.setState({ conceptItems: { ...conceptItems, [props.section]: next } });
  if (!enabled)
    return (
      <EmptyState
        headingLevel={1}
        title="This module is currently hidden"
        description="Enable optional concepts in Preview controls to review its design. No production feature flag will change."
      />
    );
  return (
    <>
      <PageHeading
        title={optionalLabels[props.section] ?? "Concept preview"}
        description={descriptions[props.section] ?? "A design concept for your next workflow."}
        action={
          <Button onClick={() => setAdd(true)}>
            <Plus size={16} aria-hidden="true" />
            {t("Add an example")}
          </Button>
        }
      />
      <div className="panel mb-6 flex gap-4 items-start">
        <span className="feature-icon">
          <Layers3 aria-hidden="true" />
        </span>
        <div>
          <h3 className="!text-sm">{t("A concept, not a connected feature")}</h3>
          <p className="text-sm text-muted-foreground mt-2">
            {t(
              "This module is hidden in the existing skin. You can explore its layout and add local examples here.",
            )}
          </p>
        </div>
      </div>
      <StaticDataTable
        label={optionalLabels[props.section] ?? "Concept preview"}
        data={items}
        columns={[
          { id: "name", label: "Name", cell: (row) => row.name },
          {
            id: "status",
            label: "Status",
            cell: () => <span className="tag accent">{t("Concept preview")}</span>,
          },
          {
            id: "action",
            label: "Actions",
            cell: (row) => (
              <Button variant="ghost" onClick={() => setDeleting(row)}>
                {t("Remove")}
              </Button>
            ),
          },
        ]}
      />
      <div className="mt-6">
        <DemoNotice />
      </div>
      {add && (
        <FormDialog
          title="Add an example"
          fields={[{ name: "name", label: "Example name" }]}
          onClose={() => setAdd(false)}
          onSave={(values) =>
            setItems([...items, { id: createDemoId(props.section), name: values.name }])
          }
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={t("Remove this demo example?")}
        desc={t("Only this local design preview will change. No production data will be removed.")}
        confirmText={t("Remove example")}
        destructive
        handleConfirm={() => {
          if (!deleting) return;
          useDemoStore.setState((state) => ({
            conceptItems: {
              ...state.conceptItems,
              [props.section]: (state.conceptItems[props.section] ?? []).filter(
                (item) => item.id !== deleting.id,
              ),
            },
          }));
          setDeleting(null);
        }}
      />
    </>
  );
}
