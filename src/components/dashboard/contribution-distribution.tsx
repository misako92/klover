"use client";

import Link from "next/link";

import { PieChart as PieChartIcon } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useComplianceData } from "@/features/compliance/context/compliance-data-context";

const COLORS = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5", "#ecfdf5"];

export function ContributionDistribution() {
  const { analytics } = useComplianceData();
  const data = analytics.byMaterial
    .filter((item) => item.percent > 0)
    .slice(0, 6)
    .map((item, index) => ({
      name: item.label,
      value: item.percent,
      color: COLORS[index % COLORS.length],
    }));

  return (
    <Card className="glass-card flex h-full flex-col border-border/40 shadow-soft transition-all duration-300 hover:shadow-soft-lg">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">Matieres dominantes</CardTitle>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground text-xs hover:text-foreground">
            <Link href="/dashboard/analytics">Voir analytics</Link>
          </Button>
        </div>
        <CardDescription>Basée sur les contributions estimées de votre catalogue classé.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center pb-4">
        {data.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center text-center text-muted-foreground text-sm">
            Classez davantage de produits pour afficher une répartition exploitable.
          </div>
        ) : (
          <>
            <div className="relative h-[200px] w-full max-w-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {data.map((entry, index) => (
                      <Cell key={entry.name || `cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] text-muted-foreground uppercase">{payload[0].name}</span>
                              <span className="font-bold text-muted-foreground">{payload[0].value}%</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="font-bold text-3xl text-foreground">100%</span>
                  <p className="text-muted-foreground text-xs">catalogue classe</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid w-full max-w-sm grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {data.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="flex-1 truncate text-muted-foreground">{item.name}</span>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
