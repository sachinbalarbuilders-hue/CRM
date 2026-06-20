"use client";

import { useTheme } from "next-themes";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface LineChartProps {
  data: any[];
  xKey: string;
  yKeys: string[];
  colors?: string[];
}

export function DashboardLineChart({ data, xKey, yKeys, colors = ["#2563eb", "#16a34a"] }: LineChartProps) {
  const { theme } = useTheme();
  const textColor = theme === "dark" ? "#a1a1aa" : "#71717a";
  const gridColor = theme === "dark" ? "#27272a" : "#e4e4e7";

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
        <XAxis
          dataKey={xKey}
          stroke={textColor}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          dy={10}
        />
        <YAxis
          stroke={textColor}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: theme === "dark" ? "#18181b" : "#ffffff",
            borderColor: theme === "dark" ? "#27272a" : "#e4e4e7",
            borderRadius: "8px",
            color: theme === "dark" ? "#f4f4f5" : "#09090b",
          }}
          itemStyle={{ color: theme === "dark" ? "#f4f4f5" : "#09090b" }}
        />
        {yKeys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[i % colors.length]}
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

interface PieChartProps {
  data: { name: string; value: number }[];
  colors?: string[];
}

export function DashboardPieChart({ data, colors = ["#2563eb", "#16a34a", "#eab308", "#dc2626", "#9333ea"] }: PieChartProps) {
  const { theme } = useTheme();
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: theme === "dark" ? "#18181b" : "#ffffff",
            borderColor: theme === "dark" ? "#27272a" : "#e4e4e7",
            borderRadius: "8px",
            color: theme === "dark" ? "#f4f4f5" : "#09090b",
          }}
          itemStyle={{ color: theme === "dark" ? "#f4f4f5" : "#09090b" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
