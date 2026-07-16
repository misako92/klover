"use client";

import * as React from "react";

import { Bar, BarChart, CartesianGrid, Cell, Label, LabelList, Pie, PieChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type BreakdownItem = { name: string; value: number; percent?: number };

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#22c55e", // emerald-500
  "#3b82f6", // blue-500
  "#ef4444", // red-500
  "#eab308", // yellow-500
];

export function MaterialsChart({ data }: { data: BreakdownItem[] }) {
  // Transformer les données pour le chart et assigner des couleurs
  const chartData = React.useMemo(() => {
    return data.map((item, index) => ({
      browser: item.name,
      visitors: item.value,
      fill: CHART_COLORS[index % CHART_COLORS.length],
      percent: item.percent,
    }));
  }, [data]);

  const totalVisitors = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.visitors, 0);
  }, [chartData]);

  const chartConfig = {
    visitors: {
      label: "Volume",
    },
    ...data.reduce(
      (acc, item, index) => {
        acc[item.name] = {
          label: item.name,
          color: CHART_COLORS[index % CHART_COLORS.length],
        };
        return acc;
      },
      {} as Record<string, { label: string; color: string }>,
    ),
  } satisfies ChartConfig;

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Répartition par Matière</CardTitle>
        <CardDescription>Volume total importé par type de matériau</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={chartData} dataKey="visitors" nameKey="browser" innerRadius={60} strokeWidth={5}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground font-bold text-3xl">
                          {totalVisitors.toLocaleString()}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                          Unités
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="browser" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="text-muted-foreground leading-none">
          Affichage des données basées sur les déclarations importées.
        </div>
      </CardFooter>
    </Card>
  );
}

export function OrganismsChart({ data }: { data: BreakdownItem[] }) {
  const chartData = React.useMemo(() => {
    return data.map((item, index) => ({
      organism: item.name,
      value: item.value,
      fill: CHART_COLORS[index % CHART_COLORS.length], // Pour avoir des couleurs variées
      percent: item.percent,
    }));
  }, [data]);

  const chartConfig = {
    value: {
      label: "Est. Fees (€)",
      color: "var(--chart-1)",
    },
    label: {
      color: "var(--background)",
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contributions par Éco-Organisme</CardTitle>
        <CardDescription>Estimation des coûts par organisme</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              right: 16,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="organism"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 15) + (value.length > 15 ? "..." : "")}
            />
            <XAxis dataKey="value" type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Bar dataKey="value" layout="vertical" radius={4}>
              <LabelList
                dataKey="percent"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
                formatter={(value: number | string) => `${value}%`}
              />
              {chartData.map((entry, index) => (
                <Cell key={entry.organism || `cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="text-muted-foreground leading-none">Répartition estimée des contributions financières.</div>
      </CardFooter>
    </Card>
  );
}
