import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, ArrowUpRight, CreditCard, Wallet, Gift, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormDialog } from "@/components/form-dialog";
import { PageHeading, StaticDataTable, Status, Select, AppLink } from "@/components/primitives";
import { canViewBilling, useDemoStore } from "@/demo/store";
import { formatDate, formatMoney, toIntlLocale } from "@/lib/format";

const receipts = [
  { id: "DEMO-2026-014", type: "Receipt", amount: 100, date: "2026-11-12", status: "Paid" },
  { id: "DEMO-2026-013", type: "Statement", amount: 169.9, date: "2026-11-01", status: "Paid" },
  { id: "DEMO-2026-012", type: "Receipt", amount: 200, date: "2026-10-28", status: "Paid" },
];
export function BillingPage(props: { org?: boolean; invoices?: boolean }) {
  const { t, i18n } = useTranslation();
  const balance = useDemoStore((state) => (props.org ? state.organizationBalance : state.balance));
  const personalBalance = useDemoStore((state) => state.balance);
  const issuedTo = useDemoStore((state) => (props.org ? state.orgName : state.profileName));
  const role = useDemoStore((state) => state.role);
  const [action, setAction] = useState<string | null>(null);
  const [detail, setDetail] = useState<(typeof receipts)[number] | null>(null);
  const voided = useDemoStore((state) => state.voidedDocuments);
  const documentScope = props.org ? "studio" : "personal";
  const [voiding, setVoiding] = useState(false);
  const [type, setType] = useState("all");
  const locale = toIntlLocale(i18n.language);
  const allowed = !props.org || canViewBilling(role);
  const canFund = !props.org || role === "owner" || role === "billing";
  let title = props.org ? "Organization balance and top-ups" : "Balance and top-ups";
  if (props.invoices) title = "Statements";
  if (!allowed)
    return (
      <div className="panel">
        <PageHeading
          title="Billing access is restricted"
          description="Choose an owner, admin or billing role in the preview controls."
        />
      </div>
    );
  return (
    <>
      <PageHeading
        title={title}
        description={
          props.invoices
            ? "Receipts and statements for your organization. Not tax invoices."
            : "Keep your balance clear and your work uninterrupted."
        }
        action={
          !props.invoices && (
            <Button disabled={!canFund} onClick={() => setAction("Add demo credits")}>
              <Plus size={16} aria-hidden="true" />
              {t("Add credits")}
            </Button>
          )
        }
      />
      {!props.invoices && (
        <>
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 mb-7">
            <div className="panel !p-8">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t(props.org ? "Shared organization credits" : "Available balance")}
                </span>
                <Wallet size={22} className="text-primary" aria-hidden="true" />
              </div>
              <strong className="block text-5xl tracking-tight font-medium mt-6 mb-4">
                {formatMoney(balance, locale)}
              </strong>
              <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-border pt-5">
                <span>{t("Reserved for in-flight requests")}</span>
                <span>{formatMoney(0, locale)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                {t("Demo credits have no monetary value.")}
              </p>
            </div>
            <div className="panel">
              <h2 className="!text-base mb-4">{t("Choose how to top up")}</h2>
              {[
                { icon: CreditCard, label: "Online payment", action: "Preview payment" },
                { icon: Gift, label: "Redeem a code", action: "Redeem a demo code" },
                {
                  icon: ArrowUpRight,
                  label: "Transfer personal credits",
                  action: "Preview transfer",
                },
              ]
                .filter((item) => props.org || item.action !== "Preview transfer")
                .map((item) => (
                  <Button
                    key={item.action}
                    variant="ghost"
                    className="!flex !w-full !h-auto !py-4 !justify-start border-b border-border !rounded-none last:border-0"
                    disabled={!canFund}
                    onClick={() => setAction(item.action)}
                  >
                    <item.icon
                      size={18}
                      className="text-muted-foreground mr-2"
                      aria-hidden="true"
                    />
                    {t(item.label)}
                    <ArrowUpRight
                      className="ml-auto text-muted-foreground"
                      size={15}
                      aria-hidden="true"
                    />
                  </Button>
                ))}
            </div>
          </div>
          <div className="section-heading">
            <h2 className="!text-lg">{t("Billing history")}</h2>
            {props.org && (
              <AppLink to="/o/studio/invoices" className="text-link">
                {t("View statements")}
                <ArrowUpRight size={15} aria-hidden="true" />
              </AppLink>
            )}
          </div>
        </>
      )}
      {props.invoices && (
        <div className="toolbar">
          <Select
            label="Document type"
            value={type}
            onChange={setType}
            options={[
              { value: "all", label: "All documents" },
              { value: "Receipt", label: "Receipt" },
              { value: "Statement", label: "Statement" },
            ]}
          />
        </div>
      )}
      <StaticDataTable
        label="Billing history"
        data={receipts.filter((item) => type === "all" || item.type === type)}
        columns={[
          {
            id: "id",
            label: "Document",
            cell: (row) => (
              <Button variant="link" className="!px-0 !text-xs" onClick={() => setDetail(row)}>
                <ReceiptText size={15} aria-hidden="true" />
                {row.id}
              </Button>
            ),
          },
          { id: "type", label: "Type", cell: (row) => t(row.type) },
          { id: "date", label: "Date", cell: (row) => formatDate(row.date, locale) },
          { id: "amount", label: "Amount", cell: (row) => formatMoney(row.amount, locale) },
          {
            id: "status",
            label: "Status",
            cell: (row) => (
              <Status
                value={voided.includes(`${documentScope}:${row.id}`) ? "Voided" : row.status}
              />
            ),
          },
        ]}
      />
      {action && (
        <FormDialog
          title={action}
          disabled={!canFund}
          validate={(values) => {
            const errors: Record<string, string> = {};
            if (values.code && values.code !== "DEMO-100")
              errors.code = "Use the example code DEMO-100.";
            if (values.amount && Number(values.amount) <= 0)
              errors.amount = "Enter an amount greater than zero.";
            if (action === "Preview transfer" && Number(values.amount) > personalBalance)
              errors.amount = "The amount exceeds your personal demo balance.";
            return errors;
          }}
          description="This is a payment preview. No transaction or real balance change will occur."
          fields={
            action === "Redeem a demo code"
              ? [
                  {
                    name: "code",
                    label: "Demo redemption code",
                    autoComplete: "off",
                    spellCheck: false,
                    value: "DEMO-100",
                    hint: "Use DEMO-100 to add 100 simulated credits.",
                  },
                ]
              : [{ name: "amount", label: "Amount in USD", type: "number", value: "50" }]
          }
          submitLabel="Apply to demo balance"
          onClose={() => setAction(null)}
          onSave={(values) => {
            if (!canFund) return false;
            const amount = Number(values.amount ?? 100);
            if (action === "Preview transfer") {
              useDemoStore.setState({
                balance: personalBalance - amount,
                organizationBalance: balance + amount,
              });
            } else if (props.org) {
              useDemoStore.setState({ organizationBalance: balance + amount });
            } else {
              useDemoStore.setState({ balance: balance + amount });
            }
            toast.success(t("Demo balance updated. No payment was made."));
          }}
        />
      )}
      {detail && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setDetail(null);
          }}
          title={t(detail.type)}
          description={detail.id}
          contentClassName="sm:max-w-lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setDetail(null)}>
                {t("Close")}
              </Button>
              {props.org && role === "owner" && (
                <Button
                  variant="destructive"
                  disabled={voided.includes(`${documentScope}:${detail.id}`)}
                  onClick={() => setVoiding(true)}
                >
                  {t("Void document")}
                </Button>
              )}
            </>
          }
        >
          <div className="py-3">
            <p className="text-muted-foreground text-sm">{t("Issued to")}</p>
            <h3 className="mt-1">{issuedTo}</h3>
            <div className="my-6 border-y border-border py-6 flex justify-between items-center">
              <span>{t("Total")}</span>
              <strong className="text-3xl font-medium">{formatMoney(detail.amount, locale)}</strong>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("This sample document is not a tax invoice. Voiding does not issue a refund.")}
            </p>
          </div>
        </Dialog>
      )}
      <ConfirmDialog
        open={voiding}
        onOpenChange={setVoiding}
        disabled={role !== "owner"}
        title={t("Void this sample document?")}
        desc={t("Only the document status changes in this preview. No refund is issued.")}
        confirmText={t("Void document")}
        destructive
        handleConfirm={() => {
          if (role !== "owner") return;
          if (detail)
            useDemoStore.setState({
              voidedDocuments: [...voided, `${documentScope}:${detail.id}`],
            });
          setVoiding(false);
          setDetail(null);
        }}
      />
    </>
  );
}
