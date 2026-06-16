"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = { count: { label: "Scans" } };

export function DiagnosisBarChart({ data }) {
  // Shorten labels for the axis.
  const rows = data.map((d) => ({
    ...d,
    short: d.label.length > 10 ? `${d.label.slice(0, 9)}…` : d.label,
  }));

  return (
    <Card className="col-span-full xl:col-span-1">
      <CardHeader>
        <CardTitle>Diagnoses by condition</CardTitle>
        <CardDescription>How your scans break down across the 10 classes</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <BarChart data={rows} margin={{ left: -16, right: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="short"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              angle={-35}
              textAnchor="end"
              height={64}
              interval={0}
              fontSize={11}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent nameKey="label" />}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive>
              {rows.map((row) => (
                <Cell key={row.id} fill={row.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
