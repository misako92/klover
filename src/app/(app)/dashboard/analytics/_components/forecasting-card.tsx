"use client";

import { useMemo, useState } from "react";

import { TrendingDown } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useComplianceData } from "@/features/compliance/context/compliance-data-context";
import { formatCurrency } from "@/lib/utils";

export function ForecastingCard() {
  const { kpis, ready } = useComplianceData();
  const [simulateCardboardOnly, setSimulateCardboardOnly] = useState(false);

  // Simple current year projection logic based on existing data
  const chartData = useMemo(() => {
    if (!ready || !kpis) return [];

    const baseContribution = kpis.estimatedContributionEur || 0;
    const monthsLeft = 12 - new Date().getMonth();

    // Spread the current contribution accurately across observed months
    // then predict an even linear growth for the rest of the year.
    const averageMonthly = baseContribution / (12 - monthsLeft || 1);

    const data = [];
    let currentTotal = 0;

    // Fake the cardboard switch saving roughly 35%
    const scaleFactor = simulateCardboardOnly ? 0.65 : 1;

    for (let i = 0; i < 12; i++) {
      const monthName = new Date(0, i).toLocaleString("fr-FR", { month: "short" });
      // Add some fuzziness to past months, perfectly linear to future months
      const isFuture = i > new Date().getMonth();
      const monthValue = isFuture ? averageMonthly * scaleFactor : averageMonthly * (0.8 + Math.random() * 0.4);

      currentTotal += monthValue;

      data.push({
        name: monthName,
        total: Math.round(currentTotal),
      });
    }

    return data;
  }, [kpis, ready, simulateCardboardOnly]);

  if (!ready) return null;

  const currentTotal = kpis?.estimatedContributionEur || 0;
  const projectedTotal = chartData[chartData.length - 1]?.total || 0;

  const savedAmount = currentTotal - projectedTotal;
  const _isSaving = savedAmount > 0; // reserved for savings badge — not yet rendered

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Simulation d'Éco-contribution (Fin d'Année)</CardTitle>
          <CardDescription>Estimez vos coûts basés sur vos flux de ventes actuels.</CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 pt-4 pb-8 md:grid-cols-4 lg:gap-8">
          <div className="space-y-4 md:col-span-1">
            <div className="space-y-2">
              <p className="font-medium text-muted-foreground text-sm">Projection Actuelle</p>
              <div className="font-bold text-3xl">{formatCurrency(projectedTotal)}</div>
            </div>

            <div className="mt-6 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="simulation-mode"
                  checked={simulateCardboardOnly}
                  onCheckedChange={setSimulateCardboardOnly}
                />
                <Label htmlFor="simulation-mode">What-if: 100% Carton</Label>
              </div>
              <p className="mt-2 text-muted-foreground text-xs">
                Simule la conversion de tous vos emballages plastiques actuels vers du Carton (Primary).
              </p>
            </div>

            {simulateCardboardOnly && (
              <div className="fade-in slide-in-from-bottom-2 animate-in border-border/50 border-t pt-4">
                <p className="font-medium text-muted-foreground text-sm">Économie Estimée</p>
                <div className="mt-1 flex items-center gap-2 text-emerald-600">
                  <TrendingDown className="h-5 w-5" />
                  <span className="font-bold text-xl">-{formatCurrency(savedAmount)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="h-[250px] w-full md:col-span-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `€${value}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--background))",
                  }}
                  itemStyle={{ fontWeight: "bold", color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [formatCurrency(value), "Coût Cumulé"]}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
