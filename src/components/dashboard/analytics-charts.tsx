"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useComplianceData } from "@/features/compliance/context/compliance-data-context";

// Custom Tooltip for Glassmorphism feel
// biome-ignore lint/suspicious/noExplicitAny: recharts typing bypass
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel rounded-lg border border-white/50 bg-white/80 p-2 text-xs shadow-lg backdrop-blur-md">
        <p className="mb-1 font-semibold">{payload[0].name}</p>
        <p className="text-emerald-700">
          {payload[0].value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
        </p>
        {payload[0].payload.percent && (
          <p className="text-muted-foreground">{Math.round(payload[0].payload.percent)}%</p>
        )}
      </div>
    );
  }
  return null;
};

const COLORS = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5", "#ecfdf5"];

export function MaterialDistributionChart() {
  const { analytics } = useComplianceData();
  const data = analytics.byMaterial.map((item) => ({
    name: item.label,
    value: item.valueEur,
    percent: item.percent,
  }));

  if (data.length === 0)
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>
    );

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((_entry, index) => (
              <Cell key={_entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OrganismDistributionChart() {
  const { analytics } = useComplianceData();
  const data = analytics.byOrganism.map((item) => ({
    name: item.label,
    value: item.valueEur,
    percent: item.percent,
  }));

  if (data.length === 0)
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>
    );

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((_entry, index) => (
              <Cell key={_entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PackagingDistributionChart() {
  const { analytics } = useComplianceData();
  const data =
    analytics.byPackagingType?.map((item) => ({
      name: item.label,
      value: item.valueEur,
      percent: item.percent,
    })) || [];

  if (data.length === 0)
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>
    );

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((_entry, index) => (
              <Cell key={_entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopContributorsChart() {
  const { analytics } = useComplianceData();
  const data = analytics.topContributors.slice(0, 5).map((item) => ({
    name: item.name.length > 15 ? `${item.name.substring(0, 15)}...` : item.name,
    full_name: item.name,
    value: item.contributionEur,
  }));

  if (data.length === 0)
    return (
      <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>
    );

  return (
    <div className="mt-4 h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f4f4f5", opacity: 0.4 }} />
          <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} animationDuration={1500}>
            {data.map((_entry, index) => (
              <Cell key={_entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
