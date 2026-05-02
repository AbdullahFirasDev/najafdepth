"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@/components/ui/card";

interface AnalyticsChartProps {
  data: Array<{
    name: string;
    views: number;
    engagement: number;
  }>;
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  return (
    <Card className="flex h-[320px] min-w-0 flex-col overflow-hidden sm:h-[380px]">
      <div className="mb-6">
        <h3 className="text-xl font-bold sm:text-2xl">تحليلات الأداء</h3>
        <p className="text-muted-foreground text-sm">
          قراءات يومية وتفاعل القراء خلال الأسبوع الجاري.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 20, right: 8, left: 0, bottom: 12 }}
          >
            <defs>
              <linearGradient id="viewsFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#6B4423" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#6B4423" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="engagementFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#C89B6D" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#C89B6D" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(107,68,35,0.15)"
            />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              minTickGap={12}
            />
            <YAxis tickLine={false} axisLine={false} width={34} />
            <Tooltip
              contentStyle={{
                borderRadius: "20px",
                border: "1px solid rgba(107,68,35,0.12)",
                background: "rgba(255,248,243,0.95)",
              }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#6B4423"
              strokeWidth={3}
              fill="url(#viewsFill)"
            />
            <Area
              type="monotone"
              dataKey="engagement"
              stroke="#C89B6D"
              strokeWidth={2}
              fill="url(#engagementFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
