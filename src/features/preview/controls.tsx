import { useTranslation } from "react-i18next";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "@/components/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AppLink, Select, DemoNotice } from "@/components/primitives";
import { useDemoStore, type Role, type Scenario } from "@/demo/store";
import { optionalLabels } from "@/demo/fixtures";
import { personalLinks, personalSettings, orgLinks, workspaceLinks } from "@/demo/navigation";

export function PreviewControls(props: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const role = useDemoStore((state) => state.role);
  const scenario = useDemoStore((state) => state.scenario);
  const optional = useDemoStore((state) => state.showOptional);
  const setRole = useDemoStore((state) => state.setRole);
  const setScenario = useDemoStore((state) => state.setScenario);
  const reset = useDemoStore((state) => state.reset);
  const groups = [
    {
      title: "Public pages",
      links: [
        { path: "home", label: "Home" },
        { path: "models", label: "Models" },
        { path: "discover", label: "Discover" },
        { path: "providers", label: "Providers" },
        { path: "pricing", label: "Pricing" },
        { path: "rankings", label: "Rankings" },
        { path: "status", label: "Service status" },
        { path: "docs", label: "Documentation" },
        { path: "invite/demo", label: "Invitation" },
      ],
    },
    { title: "Personal workspace", links: [...personalLinks, ...personalSettings] },
    {
      title: "Organization",
      links: [
        { path: "o", label: "My organizations" },
        ...orgLinks.map((link) => ({ ...link, path: `o/studio/${link.path}` })),
        ...workspaceLinks.map((link) => ({
          ...link,
          path: `o/studio/w/default/${link.path}`,
          label: `Workspace: ${link.label}`,
        })),
      ],
    },
  ];
  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
      title={t("Preview controls")}
      description={t("Explore every screen and state. Nothing here changes your live skin.")}
      contentClassName="sm:max-w-4xl"
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              toast.success(t("Demo data reset"));
            }}
          >
            <RotateCcw size={15} aria-hidden="true" />
            {t("Reset demo")}
          </Button>
          <Button onClick={props.onClose}>{t("Back to preview")}</Button>
        </>
      }
    >
      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <div className="field !mb-0">
          <label htmlFor="preview-role">{t("Preview role")}</label>
          <Select
            id="preview-role"
            label="Preview role"
            value={role}
            onChange={(value) => setRole(value as Role)}
            options={["owner", "admin", "billing", "member", "auditor"].map((value) => ({
              value,
              label: value,
            }))}
          />
        </div>
        <div className="field !mb-0">
          <label htmlFor="preview-state">{t("Page state")}</label>
          <Select
            id="preview-state"
            label="Page state"
            value={scenario}
            onChange={(value) => setScenario(value as Scenario)}
            options={["normal", "empty", "loading", "error", "restricted", "paused"].map(
              (value) => ({ value, label: value }),
            )}
          />
        </div>
      </div>
      <div className="flex justify-between items-center gap-4 p-4 rounded-xl bg-muted mb-6">
        <div>
          <h3 className="!text-sm">{t("Show optional concepts")}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {t("Rankings and seven modules hidden in the existing skin.")}
          </p>
        </div>
        <Switch
          checked={optional}
          onCheckedChange={(checked) => useDemoStore.setState({ showOptional: checked })}
          aria-label={t("Show optional concepts")}
        />
      </div>
      <div className="review-grid">
        {groups.map((group) => (
          <section key={group.title}>
            <h3>{t(group.title)}</h3>
            {group.links.map((link) => (
              <AppLink key={link.path} to={`/${link.path}`} onClick={props.onClose}>
                {t(link.label)}
              </AppLink>
            ))}
          </section>
        ))}
      </div>
      {optional && (
        <div className="mt-5 pt-5 border-t border-border flex flex-wrap gap-3">
          {Object.entries(optionalLabels).map(([path, label]) => (
            <AppLink key={path} to={`/console/${path}`} onClick={props.onClose} className="tag">
              {t(label)}
            </AppLink>
          ))}
        </div>
      )}
      <div className="mt-6">
        <DemoNotice />
      </div>
    </Dialog>
  );
}
