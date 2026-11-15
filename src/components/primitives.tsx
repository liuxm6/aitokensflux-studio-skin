import type { ComponentPropsWithRef, ReactNode, Ref } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, Inbox, CircleCheck, CircleAlert } from "lucide-react";
import { Button } from "./ui/button";
import { SelectRoot, SelectValue, SelectTrigger, SelectContent, SelectItem } from "./ui/select";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "./ui/table";
import { cn } from "@/lib/utils";
import type { RouteSearch } from "@/lib/route-search";

export function AppLink(
  props: { to: string; search?: RouteSearch } & Omit<ComponentPropsWithRef<"a">, "href">,
) {
  const { to, search, ...anchorProps } = props;
  return (
    <Link
      to="/$"
      params={{ _splat: to.replace(/^\//, "") }}
      search={search}
      activeOptions={{ exact: true, includeSearch: false }}
      {...anchorProps}
    />
  );
}

export function PageHeading(props: {
  title: string;
  description: string;
  action?: ReactNode;
  eyebrow?: string;
  level?: 1 | 2;
  titleValues?: Record<string, string | number>;
}) {
  const { t } = useTranslation();
  const Heading = props.level === 2 ? "h2" : "h1";
  return (
    <div className="page-heading">
      <div>
        {props.eyebrow && <p className="mb-3 text-sm text-muted-foreground">{t(props.eyebrow)}</p>}
        <Heading>{t(props.title, props.titleValues)}</Heading>
        <p>{t(props.description)}</p>
      </div>
      {props.action}
    </div>
  );
}

export function Select({
  triggerRef,
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; disabled?: boolean; localizeLabel?: boolean }[];
  className?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  descriptionId?: string;
  onBlur?: () => void;
  triggerRef?: Ref<HTMLButtonElement>;
}) {
  const { t } = useTranslation();
  const items = props.options.map((option) => ({
    ...option,
    label: option.localizeLabel === false ? option.label : t(option.label),
  }));
  return (
    <div className={cn("studio-select", props.className)} data-slot="select-wrapper">
      <SelectRoot
        value={props.value || null}
        onValueChange={(value) => {
          if (value !== null) props.onChange(value);
        }}
        items={items}
        disabled={props.disabled}
        name={props.name}
        modal={false}
      >
        <SelectTrigger
          id={props.id}
          ref={triggerRef}
          aria-label={t(props.label)}
          aria-invalid={props.invalid || undefined}
          aria-describedby={props.descriptionId}
          onBlur={props.onBlur}
        >
          <SelectValue placeholder={t("Select an option")} />
        </SelectTrigger>
        <SelectContent>
          {items.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
    </div>
  );
}

export function EmptyState(props: {
  title?: string;
  description?: string;
  action?: ReactNode;
  headingLevel?: 1 | 2 | 3;
}) {
  const { t } = useTranslation();
  const Heading = ({ 1: "h1", 2: "h2", 3: "h3" } as const)[props.headingLevel ?? 3];
  return (
    <div className="empty-state" role="status">
      <span className="empty-icon">
        <Inbox aria-hidden="true" />
      </span>
      <Heading className="empty-title">{t(props.title ?? "Nothing here yet")}</Heading>
      <p>{t(props.description ?? "Try a different search or reset your filters.")}</p>
      {props.action}
    </div>
  );
}

export function Status(props: { value: string }) {
  const { t } = useTranslation();
  const good = ["Active", "Completed", "Operational", "Paid", "Enabled"].includes(props.value);
  return (
    <span className={cn("status-badge", good ? "status-good" : "status-neutral")}>
      {good ? <CircleCheck aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
      {t(props.value)}
    </span>
  );
}

export type Column<T> = { id: string; label: string; cell: (item: T) => ReactNode };
// Local composition of new-api's retained table primitives: no business API or global store.
export function StaticDataTable<T extends { id: string }>(props: {
  columns: Column<T>[];
  data: T[];
  label: string;
}) {
  const { t } = useTranslation();
  if (!props.data.length) return <EmptyState />;
  return (
    <div className="data-surface">
      <Table aria-label={t(props.label)}>
        <TableHeader>
          <TableRow>
            {props.columns.map((column) => (
              <TableHead key={column.id}>{t(column.label)}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.data.map((row) => (
            <TableRow key={row.id}>
              {props.columns.map((column) => (
                <TableCell key={column.id}>{column.cell(row)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function TextLink(props: { to: string; children: ReactNode }) {
  return (
    <AppLink to={props.to} className="text-link">
      {props.children}
      <ArrowUpRight size={16} aria-hidden="true" />
    </AppLink>
  );
}

export function DemoNotice(props: { children?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="demo-notice">
      <span className="demo-dot" aria-hidden="true" />
      {props.children ?? t("Design preview. All data and actions are simulated.")}
    </div>
  );
}

export function Pagination(props: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="pagination">
      <p>
        {t("Page {{page}} of {{pages}}", { page: props.page, pages: Math.max(props.pages, 1) })}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={props.page <= 1}
          onClick={() => props.onChange(props.page - 1)}
        >
          {t("Previous")}
        </Button>
        <Button
          variant="outline"
          disabled={props.page >= props.pages}
          onClick={() => props.onChange(props.page + 1)}
        >
          {t("Next")}
        </Button>
      </div>
    </div>
  );
}
