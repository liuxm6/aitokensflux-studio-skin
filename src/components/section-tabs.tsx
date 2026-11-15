import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";

export function SectionTabs(props: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  children?: ReactNode;
  hideTabs?: boolean;
}) {
  const { t } = useTranslation();
  if (props.hideTabs) return <>{props.children}</>;
  return (
    <Tabs value={props.value} onValueChange={(value) => props.onChange(String(value))}>
      <TabsList
        variant="line"
        className="tab-list !h-auto !w-full !justify-start !gap-6 !p-0"
        aria-label={t(props.label)}
      >
        {props.options.map((option) => (
          <TabsTrigger
            key={option}
            value={option}
            className="!min-h-11 !flex-none !px-0 !py-3 after:!hidden data-active:!border-b-primary data-active:!text-primary !rounded-none !border-b-2 !border-transparent"
          >
            {t(option)}
          </TabsTrigger>
        ))}
      </TabsList>
      {props.children !== undefined && (
        <TabsContent key={props.value} value={props.value} className="min-w-0">
          {props.children}
        </TabsContent>
      )}
    </Tabs>
  );
}
