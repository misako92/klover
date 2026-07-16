"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";

interface SparkLineProps {
  data: { value: number }[];
  color?: string;
  height?: number;
  className?: string;
}

export function SparkLine({ data, color = "#10b981", height = 50, className }: SparkLineProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} animationDuration={1500} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <span className="font-bold text-[10px] text-muted-foreground">{payload[0].value}</span>
                  </div>
                );
              }
              return null;
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
