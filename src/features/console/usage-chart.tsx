import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { EmptyState, StaticDataTable } from "@/components/primitives";
import { formatDate, formatMoney, toIntlLocale } from "@/lib/format";
import type { usage } from "@/demo/fixtures";

export function UsageChart(props: { data: typeof usage }) {
  const { t, i18n } = useTranslation();
  const [table, setTable] = useState(false);
  const locale = toIntlLocale(i18n.language);
  const hasActivity = props.data.some((row) => row.requests > 0);
  return (
    <div className="panel">
      <div className="panel-title">
        <div>
          <h2>{t("A clearer view of your usage")}</h2>
          <p>{t("Daily spend in USD · sample data")}</p>
        </div>
        <Button variant="ghost" onClick={() => setTable(!table)} aria-pressed={table}>
          {t(table ? "Chart view" : "View data")}
        </Button>
      </div>
      {!hasActivity && (
        <div className="chart-box">
          <EmptyState
            title="No requests in this period"
            description="Try a different date range or filter."
          />
        </div>
      )}
      {hasActivity &&
        (table ? (
          <StaticDataTable
            label="Usage data"
            data={props.data.map((row) => ({ ...row, id: row.day }))}
            columns={[
              { id: "date", label: "Date", cell: (row) => formatDate(row.day, locale) },
              { id: "cost", label: "Spend", cell: (row) => formatMoney(row.value, locale) },
            ]}
          />
        ) : (
          <div
            className="chart-box"
            role="img"
            aria-label={t("Daily spend chart. Use View data for exact values.")}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={props.data}
                margin={{ top: 14, right: 12, bottom: 2, left: -10 }}
                accessibilityLayer
              >
                <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={0.6} />
                <XAxis
                  dataKey="day"
                  tickFormatter={(day: string) => formatDate(day, locale)}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={12}
                  minTickGap={30}
                />
                <YAxis
                  domain={[0, "auto"]}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={76}
                  tickFormatter={(value: number) => formatMoney(value, locale)}
                />
                <Tooltip
                  cursor={{ stroke: "var(--primary)", strokeDasharray: "4 4" }}
                  content={<UsageTooltip />}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--chart)"
                  strokeWidth={2}
                  fill="var(--chart)"
                  fillOpacity={0.07}
                  isAnimationActive={false}
                  activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ))}
    </div>
  );
}

function UsageTooltip(props: {
  active?: boolean;
  payload?: readonly { value?: number | string }[];
  label?: string | number;
}) {
  const { t, i18n } = useTranslation();
  const locale = toIntlLocale(i18n.language);
  if (!props.active || !props.payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <small>{formatDate(String(props.label), locale)}</small>
      <strong>{formatMoney(Number(props.payload[0].value), locale)}</strong>
      <small>{t("Daily spend")}</small>
    </div>
  );
}
