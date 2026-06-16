"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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

const chartConfig = {
  confidence: { label: "Confidence", color: "var(--chart-1)" },
};

export function ConfidenceTrendChart({ data }) {
  return (
    <Card className="col-span-full xl:col-span-1">
      <CardHeader>
        <CardTitle>Confidence trend</CardTitle>
        <CardDescription>Model confidence across your recent scans</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="grid h-[260px] place-items-center text-sm text-muted-foreground">
            Run a scan to see your confidence trend.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <AreaChart data={data} margin={{ left: -16, right: 8 }}>
              <defs>
                <linearGradient id="fillConfidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="index" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                width={32}
                unit="%"
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent nameKey="label" />}
              />
              <Area
                dataKey="confidence"
                type="monotone"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#fillConfidence)"
                isAnimationActive
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
